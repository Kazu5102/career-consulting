
// views/AdminView.tsx - v2.93 - Strategic Inbox Upgrade with Search and Smart Sort
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StoredConversation, UserInfo, AnalysisType, AnalysesState } from '../types';
import * as userService from '../services/userService';
import { analyzeTrajectory, performSkillMatching } from '../services/index';

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
import TargetIcon from '../components/icons/TargetIcon';

type AdminTab = 'user' | 'comprehensive';
type SortOrder = 'desc' | 'asc';
type InboxSortBy = 'latest' | 'name' | 'sessions';

const initialAnalysesState: AnalysesState = {
  trajectory: { status: 'idle', data: null, error: null },
  skillMatching: { status: 'idle', data: null, error: null },
  hiddenPotential: { status: 'idle', data: null, error: null },
};

const ConsultationHistoryItem: React.FC<{
    conv: StoredConversation,
    onClick: () => void
}> = ({ conv, onClick }) => {
    const dateStr = new Date(conv.date).toLocaleDateString('ja-JP', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
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
                    <p className="text-sm font-mono font-bold text-slate-800">{dateStr}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Handled by {conv.aiName}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${conv.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-800'}`}>
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
}> = ({ allUsers, selectedUserId, onUserSelect, conversationsByUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<InboxSortBy>('latest');

    const processedUsers = useMemo(() => {
        let filtered = allUsers.filter(u => 
            u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.id.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const getLatestDate = (uid: string) => {
            const convs = conversationsByUser[uid] || [];
            if (convs.length === 0) return 0;
            return Math.max(...convs.map(c => new Date(c.date).getTime()));
        };

        return filtered.sort((a, b) => {
            if (sortBy === 'name') return a.nickname.localeCompare(b.nickname);
            if (sortBy === 'sessions') return (conversationsByUser[b.id]?.length || 0) - (conversationsByUser[a.id]?.length || 0);
            return getLatestDate(b.id) - getLatestDate(a.id);
        });
    }, [allUsers, searchTerm, sortBy, conversationsByUser]);

    const formatRelativeTime = (uid: string) => {
        const convs = conversationsByUser[uid] || [];
        if (convs.length === 0) return '相談なし';
        const latestDate = new Date(Math.max(...convs.map(c => new Date(c.date).getTime())));
        return latestDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const hasRecentActivity = (uid: string) => {
        const convs = conversationsByUser[uid] || [];
        if (convs.length === 0) return false;
        const latest = Math.max(...convs.map(c => new Date(c.date).getTime()));
        return (Date.now() - latest) < 24 * 60 * 60 * 1000; // 24時間以内
    };

    return (
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="mb-4">
                <h2 className="text-lg font-black text-slate-800 px-1 mb-3">相談者インボックス</h2>
                
                {/* Search Bar */}
                <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder="名前・IDで検索"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                    />
                </div>

                {/* Sort Tabs */}
                <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100 mb-1">
                    <button onClick={() => setSortBy('latest')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${sortBy === 'latest' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}>Latest</button>
                    <button onClick={() => setSortBy('name')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${sortBy === 'name' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}>Name</button>
                    <button onClick={() => setSortBy('sessions')} className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${sortBy === 'sessions' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400'}`}>Count</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200 pb-2">
                {processedUsers.map(user => {
                    const count = conversationsByUser[user.id]?.length || 0;
                    const riskLevel = count === 0 ? 'low' : count === 1 ? 'high' : count < 3 ? 'medium' : 'low';
                    const riskColors = { high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };
                    const isRecent = hasRecentActivity(user.id);

                    return (
                        <button 
                            key={user.id} 
                            onClick={() => onUserSelect(user.id)} 
                            className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 relative overflow-hidden group ${
                                selectedUserId === user.id ? 'bg-sky-50 ring-2 ring-sky-500 shadow-md' : 'hover:bg-slate-50 border border-slate-100'
                            }`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${riskColors[riskLevel]}`}></div>
                            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-105 transition-transform relative">
                                <UserIcon />
                                {isRecent && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-sky-500 border-2 border-white rounded-full"></span>}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className="font-black text-slate-800 truncate leading-tight">{user.nickname}</p>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap ml-2">{count} sessions</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] text-slate-500 uppercase font-black">Active</span>
                                        {riskLevel === 'high' && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-[9px] text-rose-600 uppercase font-black">Attention</span>}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 italic">{formatRelativeTime(user.id)}</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
                {processedUsers.length === 0 && <p className="text-sm text-slate-400 text-center py-10 italic font-medium">該当する相談者が見つかりません</p>}
            </div>
        </div>
    );
};

const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('user');
    const [allConversations, setAllConversations] = useState<StoredConversation[]>([]);
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userToShare, setUserToShare] = useState<UserInfo | null>(null);
    
    const [historySortOrder, setHistorySortOrder] = useState<SortOrder>('desc');
    
    const [isDevLogModalOpen, setIsDevLogModalOpen] = useState(false);
    const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    
    const [analysesState, setAnalysesState] = useState<AnalysesState>(initialAnalysesState);
    const [selectedDetailConv, setSelectedDetailConv] = useState<StoredConversation | null>(null);

    const loadData = useCallback(() => {
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

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (allUsers.length > 0 && !selectedUserId) {
            setSelectedUserId(allUsers[0].id);
        }
    }, [allUsers, selectedUserId]);

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
          alert("有効な相談履歴が見つからないため、分析を実行できません。");
          return;
      }

      setAnalysesState(prev => ({ ...prev, [type]: { status: 'loading', data: null, error: null } }));
      try {
          let result;
          if (type === 'trajectory') {
              result = await analyzeTrajectory(validConversations, userId);
          } else if (type === 'skillMatching') {
              result = await performSkillMatching(validConversations);
          }
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'success', data: result, error: null } }));
      } catch (err) {
          console.error("Analysis error:", err);
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'error', data: null, error: "分析エンジンとの通信に失敗しました。" } }));
      }
    };

    const handleAddTextSubmit = (newConversation: StoredConversation, nickname?: string) => {
        const allDataRaw = localStorage.getItem('careerConsultations');
        let currentAll = [];
        if (allDataRaw) {
            try {
                const parsed = JSON.parse(allDataRaw);
                currentAll = parsed.data || (Array.isArray(parsed) ? parsed : []);
            } catch (e) { currentAll = []; }
        }
        
        const users = userService.getUsers();
        if (!users.find(u => u.id === newConversation.userId)) {
            const newUser: UserInfo = {
                id: newConversation.userId,
                nickname: nickname || `インポート様_${newConversation.userId.slice(-4)}`,
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

    const sortedConversations = useMemo(() => {
        const convs = selectedUserId ? (conversationsByUser[selectedUserId] || []) : [];
        return [...convs].sort((a, b) => {
            const timeA = new Date(a.date).getTime();
            const timeB = new Date(b.date).getTime();
            return historySortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
    }, [selectedUserId, conversationsByUser, historySortOrder]);

    const toggleSortOrder = () => setHistorySortOrder(prev => prev === 'desc' ? 'asc' : 'desc');

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 bg-slate-50 min-h-[90vh]">
            <header className="pb-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg"><TrajectoryIcon className="w-7 h-7" /></div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Professional Dashboard</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Ver 2.93 Expert Strategy Dashboard</p>
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
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Expert Strategy Engine</div>
                                        <button 
                                            onClick={() => handleRunAnalysis('trajectory', sortedConversations, selectedUserId)} 
                                            disabled={analysesState.trajectory.status === 'loading' || sortedConversations.length === 0}
                                            className="px-5 py-2.5 bg-sky-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-sky-700 active:scale-95 disabled:bg-slate-200 transition-all flex items-center gap-2"
                                        >
                                            <TrajectoryIcon className="w-4 h-4" /> 
                                            軌跡分析
                                        </button>
                                        <button 
                                            onClick={() => handleRunAnalysis('skillMatching', sortedConversations, selectedUserId)} 
                                            disabled={analysesState.skillMatching.status === 'loading' || sortedConversations.length === 0}
                                            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-emerald-700 active:scale-95 disabled:bg-slate-200 transition-all flex items-center gap-2"
                                        >
                                            <TargetIcon className="w-4 h-4 text-white" /> 
                                            適職診断
                                        </button>
                                    </div>
                                    <button onClick={() => setUserToShare(allUsers.find(u => u.id === selectedUserId) || null)} className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"><ShareIcon /></button>
                                </div>

                                <AnalysisDisplay 
                                    trajectoryState={analysesState.trajectory} 
                                    skillMatchingState={analysesState.skillMatching}
                                />

                                <section>
                                    <div className="flex justify-between items-center mb-5 px-1">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-200 text-slate-600 p-2 rounded-xl"><CalendarIcon className="w-5 h-5"/></div>
                                            <h3 className="font-bold text-slate-800 text-xl tracking-tight">個別セッション履歴 (要約・引継ぎ)</h3>
                                        </div>
                                        <button 
                                            onClick={toggleSortOrder} 
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-black bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${historySortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                            </svg>
                                            {historySortOrder === 'desc' ? '新しい順' : '古い順'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sortedConversations.map(conv => (
                                            <ConsultationHistoryItem 
                                                key={conv.id} 
                                                conv={conv} 
                                                onClick={() => setSelectedDetailConv(conv)} 
                                            />
                                        ))}
                                    </div>
                                    {sortedConversations.length === 0 && (
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
