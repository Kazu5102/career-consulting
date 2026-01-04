
// views/AdminView.tsx - v2.51 - On-demand Professional Workflow
import React, { useState, useEffect, useMemo } from 'react';
import { StoredConversation, UserInfo, AnalysisType, AnalysesState } from '../types';
import * as userService from '../services/userService';
import { analyzeTrajectory } from '../services/index';

import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import AnalysisDashboard from './AnalysisDashboard';
import AnalysisDisplay from '../components/AnalysisDisplay';

import UserIcon from '../components/icons/UserIcon';
import ShareIcon from '../components/icons/ShareIcon';
import LogIcon from '../components/icons/LogIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';

type AdminTab = 'user' | 'comprehensive';

const initialAnalysesState: AnalysesState = {
  trajectory: { status: 'idle', data: null, error: null },
  skillMatching: { status: 'idle', data: null, error: null },
  hiddenPotential: { status: 'idle', data: null, error: null },
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
                // Heuristic triage for sidebar preview: more sessions often mean lower risk, 1 session is high attention
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
                                {riskLevel === 'high' && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-[9px] text-rose-600 uppercase font-black">New Case</span>}
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
    const [analysesState, setAnalysesState] = useState<AnalysesState>(initialAnalysesState);

    const loadData = () => {
        const users = userService.getUsers();
        setAllUsers(users);
        const allDataRaw = localStorage.getItem('careerConsultations');
        if (allDataRaw) {
            try {
                const parsed = JSON.parse(allDataRaw);
                const conversations = parsed.data || (Array.isArray(parsed) ? parsed : []);
                setAllConversations(conversations);
            } catch (e) { setAllConversations([]); }
        }
        if (users.length > 0 && !selectedUserId) setSelectedUserId(users[0].id);
    };

    useEffect(loadData, []);
    useEffect(() => { setAnalysesState(initialAnalysesState); }, [selectedUserId]);

    const conversationsByUser = useMemo(() => {
        return allConversations.reduce<Record<string, StoredConversation[]>>((acc, conv) => {
            if (!acc[conv.userId]) acc[conv.userId] = [];
            acc[conv.userId].push(conv);
            return acc;
        }, {});
    }, [allConversations]);

    const handleRunAnalysis = async (type: AnalysisType, conversations: StoredConversation[], userId: string) => {
      if (conversations.length === 0) return;
      setAnalysesState(prev => ({ ...prev, [type]: { status: 'loading', data: null, error: null } }));
      try {
          const result = await analyzeTrajectory(conversations, userId);
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'success', data: result, error: null } }));
      } catch (err) {
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'error', data: null, error: "分析に失敗しました。再試行してください。" } }));
      }
    };

    const selectedUserConversations = selectedUserId ? (conversationsByUser[selectedUserId] || []) : [];

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-slate-50 min-h-[90vh]">
            <header className="pb-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><TrajectoryIcon className="w-7 h-7" /></div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Professional Dashboard</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">臨床的インサイトとトリアージ管理</p>
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
                        <button onClick={() => setIsDevLogModalOpen(true)} className="w-full flex items-center justify-center gap-2.5 py-3.5 text-sm font-bold text-purple-700 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-colors border border-purple-100"><LogIcon /> システム開発ログ</button>
                    </aside>

                    <main className="lg:col-span-9 space-y-8">
                        {selectedUserId ? (
                           <>
                                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-6">
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Strategy Engine</div>
                                        <button 
                                            onClick={() => handleRunAnalysis('trajectory', selectedUserConversations, selectedUserId)} 
                                            disabled={analysesState.trajectory.status === 'loading' || selectedUserConversations.length === 0}
                                            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-2xl shadow-xl shadow-sky-100 hover:bg-sky-700 active:scale-95 disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center gap-2.5"
                                        >
                                            <TrajectoryIcon className="w-5 h-5" /> 
                                            {analysesState.trajectory.status === 'success' ? '再分析を実行' : '深層分析を開始'}
                                        </button>
                                    </div>
                                    <button onClick={() => setUserToShare(allUsers.find(u => u.id === selectedUserId) || null)} className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"><ShareIcon /></button>
                                </div>
                                <AnalysisDisplay trajectoryState={analysesState.trajectory} />
                                {analysesState.trajectory.status === 'idle' && (
                                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                                        <TrajectoryIcon className="w-16 h-16 mb-4 opacity-20" />
                                        <h3 className="text-lg font-bold text-slate-500">深層心理の分析準備完了</h3>
                                        <p className="mt-2 text-sm">上のボタンを押すと、相談者の対話履歴から臨床的なインサイトを抽出します。</p>
                                    </div>
                                )}
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
            {userToShare && <ShareReportModal isOpen={!!userToShare} onClose={() => setUserToShare(null)} userId={userToShare.id} conversations={conversationsByUser[userToShare.id] || []} analysisCache={{}} />}
        </div>
    );
};

export default AdminView;
