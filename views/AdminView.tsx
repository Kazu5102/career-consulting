
// views/AdminView.tsx - v2.78 - Expert Insight & Reactive Data Management
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StoredConversation, UserInfo, AnalysisType, AnalysesState } from '../types';
import * as userService from '../services/userService';
import { analyzeTrajectory } from '../services/index';

import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import AddTextModal from '../components/AddTextModal';
import DataManagementModal from '../components/DataManagementModal';
import AnalysisDashboard from './AnalysisDashboard';
import AnalysisDisplay from '../components/AnalysisDisplay';
import ConversationDetailModal from '../components/ConversationDetailModal';

import UserIcon from '../components/icons/UserIcon';
import ShareIcon from '../components/icons/ShareIcon';
import LogIcon from '../components/icons/LogIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';
import CalendarIcon from '../components/icons/CalendarIcon';
import DatabaseIcon from '../components/icons/DatabaseIcon';

type AdminTab = 'user' | 'comprehensive';

const initialAnalysesState: AnalysesState = {
  trajectory: { status: 'idle', data: null, error: null },
  skillMatching: { status: 'idle', data: null, error: null },
  hiddenPotential: { status: 'idle', data: null, error: null },
};

const ConsultationHistoryItem: React.FC<{
    conv: StoredConversation,
    onClick: () => void
}> = ({ conv, onClick }) => {
    const date = new Date(conv.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return (
        <button 
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-sky-300 hover:shadow-md transition-all group"
        >
            <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                    <CalendarIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">{date}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Handled by {conv.aiName}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${conv.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {conv.status}
                </span>
                <span className="text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 010-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </span>
            </div>
        </button>
    );
};

const UserManagementPanel: React.FC<{
    allUsers: UserInfo[],
    selectedUserId: string | null,
    onUserSelect: (userId: string) => void,
    conversationsByUser: Record<string, StoredConversation[]>,
}> = ({ allUsers, selectedUserId, onUserSelect, conversationsByUser }) => (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">相談者インボックス</h2>
        <div className="max-h-[600px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {allUsers.map(user => {
                const count = conversationsByUser[user.id]?.length || 0;
                const riskLevel = count === 0 ? 'low' : count === 1 ? 'high' : count < 3 ? 'medium' : 'low';
                const riskColors = { high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

                return (
                    <button 
                        key={user.id} 
                        onClick={() => onUserSelect(user.id)} 
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 relative overflow-hidden group ${
                            selectedUserId === user.id ? 'bg-sky-50 ring-2 ring-sky-500 shadow-md' : 'hover:bg-slate-50 border border-slate-100'
                        }`}
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${riskColors[riskLevel]}`}></div>
                        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-105 transition-transform"><UserIcon /></div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-0.5">
                                <p className="font-bold text-slate-800 truncate">{user.nickname}</p>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{count} Sessions</span>
                            </div>
                            <div className="flex gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] text-slate-500 uppercase font-black">Active</span>
                                {riskLevel === 'high' && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-[9px] text-rose-600 uppercase font-black">Attention</span>}
                            </div>
                        </div>
                    </button>
                );
            })}
            {allUsers.length === 0 && <p className="text-sm text-slate-400 text-center py-10 italic">相談者がまだいません。</p>}
        </div>
    </div>
);

const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('user');
    const [allConversations, setAllConversations] = useState<StoredConversation[]>([]);
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userToShare, setUserToShare] = useState<UserInfo | null>(null);
    
    const [isDevLogModalOpen, setIsDevLogModalOpen] = useState(false);
    const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    
    const [analysesState, setAnalysesState] = useState<AnalysesState>(initialAnalysesState);
    const [selectedDetailConv, setSelectedDetailConv] = useState<StoredConversation | null>(null);

    const loadData = useCallback(() => {
        // スプレッド演算子を用いて新しい配列参照を確実に作成し、Reactに更新を通知する
        const users = userService.getUsers();
        setAllUsers([...users]);
        
        const allDataRaw = localStorage.getItem('careerConsultations');
        if (allDataRaw) {
            try {
                const parsed = JSON.parse(allDataRaw);
                const conversations = parsed.data || (Array.isArray(parsed) ? parsed : []);
                setAllConversations([...conversations]);
            } catch (e) { setAllConversations([]); }
        }
    }, []);

    // 初回読み込みと、インポート等のリフレッシュ用
    useEffect(() => {
        loadData();
    }, [loadData]);

    // リストが読み込まれた後、未選択なら最初のユーザーを選択
    useEffect(() => {
        if (allUsers.length > 0 && !selectedUserId) {
            setSelectedUserId(allUsers[0].id);
        }
    }, [allUsers, selectedUserId]);

    // ユーザー切り替え時に分析状態をリセット
    useEffect(() => { 
        setAnalysesState(initialAnalysesState); 
    }, [selectedUserId]);

    const conversationsByUser = useMemo(() => {
        return allConversations.reduce<Record<string, StoredConversation[]>>((acc, conv) => {
            if (!acc[conv.userId]) acc[conv.userId] = [];
            acc[conv.userId].push(conv);
            return acc;
        }, {});
    }, [allConversations]);

    const handleRunAnalysis = async (type: AnalysisType, conversations: StoredConversation[], userId: string) => {
      const validConversations = conversations.filter(c => c.summary && c.summary !== '中断');
      if (validConversations.length === 0) {
          alert("有効な相談履歴（サマリーあり）が見つからないため、分析を実行できません。");
          return;
      }

      setAnalysesState(prev => ({ ...prev, [type]: { status: 'loading', data: null, error: null } }));
      try {
          const result = await analyzeTrajectory(validConversations, userId);
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'success', data: result, error: null } }));
      } catch (err) {
          console.error("Analysis error:", err);
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'error', data: null, error: "分析エンジンとの通信に失敗しました。再試行してください。" } }));
      }
    };

    const handleAddTextSubmit = (newConversation: StoredConversation) => {
        const allDataRaw = localStorage.getItem('careerConsultations');
        let currentAll = [];
        if (allDataRaw) {
            try {
                const parsed = JSON.parse(allDataRaw);
                currentAll = parsed.data || (Array.isArray(parsed) ? parsed : []);
            } catch (e) { currentAll = []; }
        }
        
        // ユーザーが存在しない場合は追加
        const users = userService.getUsers();
        if (!users.find(u => u.id === newConversation.userId)) {
            const newUser: UserInfo = {
                id: newConversation.userId,
                nickname: `インポート様_${newConversation.userId.slice(-4)}`,
                pin: '0000'
            };
            userService.saveUsers([...users, newUser]);
        }

        const updated = [...currentAll, newConversation];
        localStorage.setItem('careerConsultations', JSON.stringify({ version: 1, data: updated }));
        
        setIsAddTextModalOpen(false);
        loadData();
        setSelectedUserId(newConversation.userId);
        alert("履歴を正常にインポートしました。");
    };

    const selectedUserConversations = selectedUserId ? (conversationsByUser[selectedUserId] || []) : [];

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-slate-50 min-h-[90vh]">
            <header className="pb-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><TrajectoryIcon className="w-7 h-7" /></div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Professional Dashboard</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Ver 2.78 Expert Insight Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
                    <button onClick={() => setActiveTab('user')} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'user' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>個別カルテ</button>
                    <button onClick={() => setActiveTab('comprehensive')} className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'comprehensive' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>全体分析</button>
                </div>
            </header>

            {activeTab === 'user' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <aside className="lg:col-span-3 space-y-6">
                        <UserManagementPanel allUsers={allUsers} selectedUserId={selectedUserId} onUserSelect={setSelectedUserId} conversationsByUser={conversationsByUser} />
                        <div className="space-y-2">
                             <button onClick={() => setIsDataModalOpen(true)} className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-bold text-sky-700 bg-sky-50 rounded-2xl hover:bg-sky-100 transition-colors border border-sky-100"><DatabaseIcon /> データ管理コンソール</button>
                             <button onClick={() => setIsDevLogModalOpen(true)} className="w-full flex items-center justify-center gap-2.5 py-3 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"><LogIcon /> システム開発ログ</button>
                        </div>
                    </aside>

                    <main className="lg:col-span-9 space-y-10 pb-20">
                        {selectedUserId ? (
                           <>
                                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-6">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expert Strategy Engine</div>
                                        <button 
                                            onClick={() => handleRunAnalysis('trajectory', selectedUserConversations, selectedUserId)} 
                                            disabled={analysesState.trajectory.status === 'loading' || selectedUserConversations.length === 0}
                                            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-2xl shadow-xl shadow-sky-100 hover:bg-sky-700 active:scale-95 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center gap-2.5"
                                        >
                                            <TrajectoryIcon className="w-5 h-5" /> 
                                            {analysesState.trajectory.status === 'success' ? 'インサイトを再生成' : '深層心理分析を開始'}
                                        </button>
                                    </div>
                                    <button onClick={() => setUserToShare(allUsers.find(u => u.id === selectedUserId) || null)} className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"><ShareIcon /></button>
                                </div>

                                <AnalysisDisplay trajectoryState={analysesState.trajectory} />

                                <section>
                                    <div className="flex items-center gap-3 mb-5 px-1">
                                        <div className="bg-slate-200 text-slate-600 p-2 rounded-xl"><CalendarIcon className="w-5 h-5"/></div>
                                        <h3 className="font-bold text-slate-800 text-xl tracking-tight">個別セッション履歴 (要約・引継ぎ)</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[...selectedUserConversations].reverse().map(conv => (
                                            <ConsultationHistoryItem 
                                                key={conv.id} 
                                                conv={conv} 
                                                onClick={() => setSelectedDetailConv(conv)} 
                                            />
                                        ))}
                                    </div>
                                    {selectedUserConversations.length === 0 && (
                                        <p className="text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed rounded-3xl border-slate-200 bg-white/50">セッション履歴がありません。</p>
                                    )}
                                </section>
                           </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32 border-2 border-dashed rounded-3xl">
                                <UserIcon className="w-16 h-16 mb-4 opacity-30" />
                                <h2 className="text-xl font-bold">相談者を選択してください</h2>
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <AnalysisDashboard conversations={allConversations} />
            )}

            <DevLogModal isOpen={isDevLogModalOpen} onClose={() => setIsDevLogModalOpen(false)} />
            <DataManagementModal 
                isOpen={isDataModalOpen} 
                onClose={() => setIsDataModalOpen(false)} 
                onOpenAddText={() => setIsAddTextModalOpen(true)}
                onDataRefresh={loadData}
            />
            <AddTextModal 
                isOpen={isAddTextModalOpen} 
                onClose={() => setIsAddTextModalOpen(false)} 
                onSubmit={handleAddTextSubmit} 
                existingUserIds={allUsers.map(u => u.id)} 
            />
            {userToShare && <ShareReportModal isOpen={!!userToShare} onClose={() => setUserToShare(null)} userId={userToShare.id} conversations={conversationsByUser[userToShare.id] || []} analysisCache={{}} />}
            {selectedDetailConv && <ConversationDetailModal conversation={selectedDetailConv} onClose={() => setSelectedDetailConv(null)} />}
        </div>
    );
};

export default AdminView;
