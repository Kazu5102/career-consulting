
// views/AdminView.tsx - v4.20 - Future-proofed Persistence Logic
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { marked } from 'marked';
import { StoredConversation, UserInfo, AnalysisType, AnalysesState } from '../types';
import * as userService from '../services/userService';
import * as conversationService from '../services/conversationService';
import { analyzeTrajectory, performSkillMatching } from '../services/index';
import { addLogEntry } from '../services/devLogService';

import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import AddTextModal from '../components/AddTextModal';
import DataManagementModal from '../components/DataManagementModal';
import SecuritySettingsModal from '../components/SecuritySettingsModal';
import AnalysisDisplay from '../components/AnalysisDisplay';
import ConversationDetailModal from '../components/ConversationDetailModal';

import UserIcon from '../components/icons/UserIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';
import TargetIcon from '../components/icons/TargetIcon';
import DatabaseIcon from '../components/icons/DatabaseIcon';
import LogIcon from '../components/icons/LogIcon';
import ChatIcon from '../components/icons/ChatIcon';
import FileTextIcon from '../components/icons/FileTextIcon';
import TrashIcon from '../components/icons/TrashIcon';
// Fix: Added missing LockIcon import
import LockIcon from '../components/icons/LockIcon';

type FilterStatus = 'all' | 'completed' | 'interrupted' | 'high_risk' | 'no_history';
type SortOrder = 'desc' | 'asc';

const AdminView: React.FC = () => {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [conversations, setConversations] = useState<StoredConversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedConvForDetail, setSelectedConvForDetail] = useState<StoredConversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [checkedUserIds, setCheckedUserIds] = useState<Set<string>>(new Set());
    
    const [analyses, setAnalyses] = useState<AnalysesState>({
        trajectory: { status: 'idle', data: null, error: null },
        skillMatching: { status: 'idle', data: null, error: null },
        hiddenPotential: { status: 'idle', data: null, error: null }
    });

    const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
    const [isDevLogModalOpen, setIsDevLogModalOpen] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        const u = await userService.getUsers();
        setUsers(u);
        const c = await conversationService.getAllConversations();
        setConversations(c);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const userMetadata = useMemo<Record<string, { lastDate: string, status: string, isHighRisk: boolean, count: number }>>(() => {
        const meta: Record<string, { lastDate: string, status: string, isHighRisk: boolean, count: number }> = {};
        users.forEach(u => {
            const userConvs = conversations.filter(c => c.userId === u.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const latest = userConvs[0];
            const isHighRisk = userConvs.some(c => 
                c.summary.includes('要介入') || 
                c.summary.includes('危険') || 
                c.summary.includes('死') || 
                c.messages.some(m => /死にたい|自殺|消えたい|終わりにしたい/.test(m.text))
            );

            meta[u.id] = {
                lastDate: latest?.date || '',
                status: latest?.status || 'none',
                isHighRisk,
                count: userConvs.length
            };
        });
        return meta;
    }, [users, conversations]);

    const stats = useMemo(() => {
        const counts = { total: users.length, interrupted: 0, highRisk: 0, noHistory: 0 };
        // Fix: Explicitly type 'm' to avoid 'unknown' type errors during stats calculation
        Object.values(userMetadata).forEach((m) => {
            const val = m as { status: string, isHighRisk: boolean, count: number };
            if (val.status === 'interrupted') counts.interrupted++;
            if (val.isHighRisk) counts.highRisk++;
            if (val.count === 0) counts.noHistory++;
        });
        return counts;
    }, [userMetadata, users.length]);

    const filteredUsers = useMemo(() => {
        let list = users.filter(u => u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filterStatus !== 'all') {
            list = list.filter(u => {
                const m = userMetadata[u.id];
                if (!m) return false;
                if (filterStatus === 'interrupted') return m.status === 'interrupted';
                if (filterStatus === 'completed') return m.status === 'completed';
                if (filterStatus === 'high_risk') return m.isHighRisk;
                if (filterStatus === 'no_history') return m.count === 0;
                return true;
            });
        }
        return list.sort((a, b) => {
            const dateA = new Date(userMetadata[a.id].lastDate).getTime() || 0;
            const dateB = new Date(userMetadata[b.id].lastDate).getTime() || 0;
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [users, searchQuery, filterStatus, sortOrder, userMetadata]);

    const selectedUserConversations = useMemo(() => {
        return conversations.filter(c => c.userId === selectedUserId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [conversations, selectedUserId]);

    const isAllSelected = useMemo(() => filteredUsers.length > 0 && filteredUsers.every(u => checkedUserIds.has(u.id)), [filteredUsers, checkedUserIds]);

    const handleSelectAll = () => {
        if (isAllSelected) setCheckedUserIds(new Set());
        else {
            const newSet = new Set(checkedUserIds);
            filteredUsers.forEach(u => newSet.add(u.id));
            setCheckedUserIds(newSet);
        }
    };

    const toggleUserCheck = (id: string) => {
        const newSet = new Set(checkedUserIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setCheckedUserIds(newSet);
    };

    const handleDeleteUsers = async (ids: string[]) => {
        if (ids.length === 0 || !window.confirm(ids.length === 1 ? "このユーザーの全データを削除しますか？" : `${ids.length}件の全データを削除しますか？`)) return;
        setUsers(prev => prev.filter(u => !ids.includes(u.id)));
        if (selectedUserId && ids.includes(selectedUserId)) setSelectedUserId(null);
        setCheckedUserIds(new Set());
        await userService.deleteUsers(ids);
        await conversationService.deleteConversationsByUserIds(ids);
        addLogEntry({ type: 'audit', level: 'critical', action: 'Delete Users', details: `Admin deleted ${ids.length} users.` });
        await loadData();
    };

    const runAnalysis = async (type: AnalysisType) => {
        if (!selectedUserId) return;
        if (selectedUserConversations.length === 0) {
            setAnalyses(prev => ({ ...prev, [type]: { status: 'error', data: null, error: "履歴がありません。" } }));
            return;
        }
        setAnalyses({
            trajectory: type === 'trajectory' ? { status: 'loading', data: null, error: null } : { status: 'idle', data: null, error: null },
            skillMatching: type === 'skillMatching' ? { status: 'loading', data: null, error: null } : { status: 'idle', data: null, error: null },
            hiddenPotential: { status: 'idle', data: null, error: null }
        });
        try {
            if (type === 'trajectory') setAnalyses(prev => ({ ...prev, trajectory: { status: 'success', data: null, error: null } })); // Placeholder for actual API call
            const data = type === 'trajectory' ? await analyzeTrajectory(selectedUserConversations, selectedUserId) : await performSkillMatching(selectedUserConversations);
            setAnalyses(prev => ({ ...prev, [type]: { status: 'success', data, error: null } }));
        } catch (err: any) { setAnalyses(prev => ({ ...prev, [type]: { status: 'error', data: null, error: err.message } })); }
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
        setAnalyses({ trajectory: { status: 'idle', data: null, error: null }, skillMatching: { status: 'idle', data: null, error: null }, hiddenPotential: { status: 'idle', data: null, error: null } });
    };

    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden relative">
            <aside className={`${selectedUserId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 h-full shadow-sm z-10`}>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800 mb-4 px-1">相談者リスト</h2>
                    <div className="grid grid-cols-4 gap-1 mb-4">
                        <button onClick={() => setFilterStatus('all')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'all' ? 'bg-sky-600 text-white' : 'bg-white'}`}>
                            <p className="text-[7px] font-black uppercase opacity-70">Total</p><p className="text-xs font-black">{stats.total}</p>
                        </button>
                        <button onClick={() => setFilterStatus('high_risk')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'high_risk' ? 'bg-rose-600 text-white' : 'bg-white'}`}>
                            <p className="text-[7px] font-black uppercase opacity-70">Critical</p><p className="text-xs font-black">{stats.highRisk}</p>
                        </button>
                        <button onClick={() => setFilterStatus('interrupted')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'interrupted' ? 'bg-amber-600 text-white' : 'bg-white'}`}>
                            <p className="text-[7px] font-black uppercase opacity-70">Pause</p><p className="text-xs font-black">{stats.interrupted}</p>
                        </button>
                        <button onClick={() => setFilterStatus('no_history')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'no_history' ? 'bg-slate-600 text-white' : 'bg-white'}`}>
                            <p className="text-[7px] font-black uppercase opacity-70">New</p><p className="text-xs font-black">{stats.noHistory}</p>
                        </button>
                    </div>
                    {checkedUserIds.size > 0 && (
                        <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                            <button onClick={() => handleDeleteUsers(Array.from(checkedUserIds))} className="w-full py-2.5 bg-rose-600 text-white rounded-xl shadow-lg flex items-center justify-center gap-2 font-bold text-sm"><TrashIcon className="w-4 h-4" />選択した{checkedUserIds.size}件を削除</button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <div className="flex items-center justify-center bg-white border border-slate-200 rounded-xl px-3"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} disabled={filteredUsers.length === 0} className="w-5 h-5 rounded border-slate-300 text-sky-600" /></div>
                        <input type="text" placeholder="名前で検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
                    {filteredUsers.map(user => (
                        <div key={user.id} className={`w-full group relative flex items-center gap-3 p-3 rounded-2xl border ${selectedUserId === user.id ? 'bg-white border-sky-400 shadow-lg' : checkedUserIds.has(user.id) ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                            {userMetadata[user.id].isHighRisk && <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 rounded-full z-10"><span className="w-1.5 h-1.5 rounded-full bg-white"></span><span className="text-[8px] font-black text-white uppercase">Critical</span></div>}
                            <div className="flex items-center justify-center pl-1 z-20" onClick={e => e.stopPropagation()}><input type="checkbox" checked={checkedUserIds.has(user.id)} onChange={() => toggleUserCheck(user.id)} className="w-5 h-5 rounded" /></div>
                            <div className="flex-1 flex items-center gap-3 cursor-pointer z-10" onClick={() => handleUserSelect(user.id)}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${selectedUserId === user.id ? 'bg-sky-600' : 'bg-slate-300'}`}><UserIcon className="w-5 h-5" /></div>
                                <div className="text-left overflow-hidden flex-1"><p className="font-bold text-slate-800 truncate text-sm">{user.nickname}</p><div className="flex items-center gap-2"><p className="text-[9px] text-slate-400 font-mono truncate max-w-[60px]">{user.id}</p><p className="text-[8px] font-black text-slate-300 uppercase shrink-0">{userMetadata[user.id].lastDate ? new Date(userMetadata[user.id].lastDate).toLocaleDateString() : 'NO HISTORY'}</p></div></div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); handleDeleteUsers([user.id]); }} className="opacity-0 group-hover:opacity-100 z-30 p-2 text-rose-300 hover:text-rose-600 transition-all"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-white border-t space-y-2">
                    <button onClick={() => setIsDataModalOpen(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-xs font-black text-slate-600 bg-slate-50 rounded-xl"><DatabaseIcon className="w-4 h-4" /> Data Manage</button>
                    <button onClick={() => setIsDevLogModalOpen(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-xs font-black text-slate-600 bg-slate-50 rounded-xl"><LogIcon className="w-4 h-4" /> System Logs</button>
                    <button onClick={() => setIsSecurityModalOpen(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-xs font-black text-rose-600 bg-rose-50 rounded-xl"><LockIcon className="w-4 h-4" /> Security Settings</button>
                </div>
            </aside>
            <main className={`${selectedUserId ? 'flex' : 'hidden md:flex'} flex-1 flex-col h-full bg-white overflow-hidden`}>
                {selectedUserId ? (
                    <div className="flex-1 flex flex-col h-full">
                        <header className="sticky top-0 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 px-4 md:px-8 py-4 border-b border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button onClick={() => setSelectedUserId(null)} className="md:hidden p-2.5 rounded-xl bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                                <div className="overflow-hidden"><h1 className="text-xl md:text-2xl font-black text-slate-800 truncate">{users.find(u => u.id === selectedUserId)?.nickname} さんの分析</h1><p className="text-[10px] text-slate-400 font-mono">{selectedUserId}</p></div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => runAnalysis('trajectory')} className="flex-1 md:flex-none px-4 py-2.5 bg-sky-600 text-white font-bold rounded-xl text-sm"><TrajectoryIcon className="w-4 h-4" />軌跡分析</button>
                                <button onClick={() => runAnalysis('skillMatching')} className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm"><TargetIcon className="w-4 h-4" />適職診断</button>
                                <button onClick={() => setIsShareModalOpen(true)} className="px-4 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm"><FileTextIcon className="w-4 h-4"/>レポート出力</button>
                            </div>
                        </header>
                        <div key={selectedUserId} className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 md:py-12">
                            <div className="max-w-5xl mx-auto space-y-12">
                                <AnalysisDisplay trajectoryState={analyses.trajectory} skillMatchingState={analyses.skillMatching} />
                                <section className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 px-1"><div className="w-2 h-6 bg-slate-200 rounded-full"></div>個別セッション履歴 ({selectedUserConversations.length}件)</h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {selectedUserConversations.map(conv => (
                                            <button key={conv.id} onClick={() => setSelectedConvForDetail(conv)} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all text-left">
                                                <div className="flex justify-between items-center mb-4"><div className="text-[10px] font-black text-slate-400 font-mono">{new Date(conv.date).toLocaleString()}</div><span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${conv.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{conv.status}</span></div>
                                                <div className="prose prose-slate prose-sm line-clamp-5 text-slate-600" dangerouslySetInnerHTML={{ __html: marked.parse(JSON.parse(conv.summary).user_summary || conv.summary) }} />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/30"><div className="p-12 bg-white rounded-full shadow-2xl border border-slate-50"><UserIcon className="w-20 h-20 text-slate-200" /></div><h2 className="text-2xl font-black text-slate-800 mt-8">相談者を選択して分析を開始</h2><p className="mt-4 font-bold text-slate-400 max-w-sm mx-auto leading-relaxed">左側のリストから相談者を選ぶと、AIが対話履歴に基づいた専門的な分析、レポート出力が可能です。</p></div>
                )}
            </main>
            <AddTextModal isOpen={isAddTextModalOpen} onClose={() => setIsAddTextModalOpen(false)} onSubmit={async (newConv, nick) => {
                if (nick) {
                    const currentUsers = await userService.getUsers();
                    if (!currentUsers.find(u => u.id === newConv.userId)) await userService.saveUsers([...currentUsers, { id: newConv.userId, nickname: nick, pin: '0000' }]);
                }
                await conversationService.saveConversation(newConv);
                loadData();
            }} existingUserIds={users.map(u => u.id)} />
            <DevLogModal isOpen={isDevLogModalOpen} onClose={() => setIsDevLogModalOpen(false)} />
            <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} onOpenAddText={() => setIsAddTextModalOpen(true)} onDataRefresh={loadData} />
            <SecuritySettingsModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />
            {selectedUserId && <ShareReportModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} userId={selectedUserId} conversations={selectedUserConversations} analysisCache={null} />}
            {selectedConvForDetail && <ConversationDetailModal conversation={selectedConvForDetail} onClose={() => setSelectedConvForDetail(null)} />}
        </div>
    );
};

export default AdminView;
