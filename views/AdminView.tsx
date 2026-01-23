
// views/AdminView.tsx - v4.00 - Stability Enhancement
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { marked } from 'marked';
import { StoredConversation, UserInfo, AnalysisType, AnalysesState } from '../types';
import * as userService from '../services/userService';
import { analyzeTrajectory, performSkillMatching } from '../services/index';

import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import AddTextModal from '../components/AddTextModal';
import DataManagementModal from '../components/DataManagementModal';
import SecuritySettingsModal from '../components/SecuritySettingsModal';
import AnalysisDisplay from '../components/AnalysisDisplay';
import ConversationDetailModal from '../components/ConversationDetailModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

import UserIcon from '../components/icons/UserIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';
import TargetIcon from '../components/icons/TargetIcon';
import DatabaseIcon from '../components/icons/DatabaseIcon';
import LogIcon from '../components/icons/LogIcon';
import TrashIcon from '../components/icons/TrashIcon';
import ChatIcon from '../components/icons/ChatIcon';
import FileTextIcon from '../components/icons/FileTextIcon';
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
    
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

    const loadData = useCallback(() => {
        try {
            setUsers(userService.getUsers() || []);
            const stored = localStorage.getItem('careerConsultations');
            if (stored) {
                const parsed = JSON.parse(stored);
                setConversations(parsed.data || (Array.isArray(parsed) ? parsed : []));
            } else {
                setConversations([]);
            }
        } catch (e) {
            console.error("Data loading error", e);
        }
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
                c.messages.some(m => /死にたい|自殺|消えたい/.test(m.text))
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
        users.forEach(u => {
            const m = userMetadata[u.id];
            if (!m) return;
            if (m.status === 'interrupted') counts.interrupted++;
            if (m.isHighRisk) counts.highRisk++;
            if (m.count === 0) counts.noHistory++;
        });
        return counts;
    }, [userMetadata, users]);

    const filteredUsers = useMemo(() => {
        let list = users.filter(u => 
            u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.id.toLowerCase().includes(searchQuery.toLowerCase())
        );

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
            const m_a = userMetadata[a.id];
            const m_b = userMetadata[b.id];
            const dateA = m_a ? new Date(m_a.lastDate).getTime() : 0;
            const dateB = m_b ? new Date(m_b.lastDate).getTime() : 0;
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [users, searchQuery, filterStatus, sortOrder, userMetadata]);

    const selectedUserConversations = useMemo(() => {
        return conversations.filter(c => c.userId === selectedUserId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [conversations, selectedUserId]);

    const toggleDeleteMode = () => {
        const nextMode = !isDeleteMode;
        setIsDeleteMode(nextMode);
        setSelectedForDeletion(new Set());
    };

    const handleToggleUserSelection = (userId: string, e?: React.MouseEvent | React.ChangeEvent) => {
        if (e && 'stopPropagation' in e) e.stopPropagation();
        setSelectedForDeletion(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedForDeletion.size === filteredUsers.length) {
            setSelectedForDeletion(new Set());
        } else {
            setSelectedForDeletion(new Set(filteredUsers.map(u => u.id)));
        }
    };

    const executeBulkDelete = () => {
        if (selectedForDeletion.size === 0) return;
        setIsDeleteModalOpen(true);
    };

    const handleFinalDelete = () => {
        userService.deleteUsers(Array.from(selectedForDeletion));
        setIsDeleteMode(false);
        setSelectedForDeletion(new Set());
        setSelectedUserId(null);
        setIsDeleteModalOpen(false);
        loadData();
    };

    const runAnalysis = async (type: AnalysisType) => {
        if (!selectedUserId) return;

        if (selectedUserConversations.length === 0) {
            setAnalyses(prev => ({ ...prev, [type]: { status: 'error', data: null, error: "履歴が1件もありません。" } }));
            return;
        }

        setAnalyses({
            trajectory: type === 'trajectory' ? { status: 'loading', data: null, error: null } : { status: 'idle', data: null, error: null },
            skillMatching: type === 'skillMatching' ? { status: 'loading', data: null, error: null } : { status: 'idle', data: null, error: null },
            hiddenPotential: { status: 'idle', data: null, error: null }
        });

        try {
            if (type === 'trajectory') {
                const data = await analyzeTrajectory(selectedUserConversations, selectedUserId);
                setAnalyses(prev => ({ ...prev, trajectory: { status: 'success', data, error: null } }));
            } else if (type === 'skillMatching') {
                const data = await performSkillMatching(selectedUserConversations);
                setAnalyses(prev => ({ ...prev, skillMatching: { status: 'success', data, error: null } }));
            }
        } catch (err: any) {
            setAnalyses(prev => ({ ...prev, [type]: { status: 'error', data: null, error: err.message || "分析エラーが発生しました。" } }));
        }
    };

    const handleUserSelect = (userId: string) => {
        if (isDeleteMode) {
            handleToggleUserSelection(userId);
            return;
        }
        setSelectedUserId(userId);
        setAnalyses({
            trajectory: { status: 'idle', data: null, error: null },
            skillMatching: { status: 'idle', data: null, error: null },
            hiddenPotential: { status: 'idle', data: null, error: null }
        });
    };

    const handleDeselectUser = () => {
        setSelectedUserId(null);
    };

    const parseUserSummary = (rawSummary: string): string => {
        try {
            const parsed = JSON.parse(rawSummary);
            return parsed.user_summary || rawSummary;
        } catch (e) {
            return rawSummary;
        }
    };

    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden relative">
            <aside className={`
                ${selectedUserId ? 'hidden md:flex' : 'flex'}
                flex-col w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 h-full shadow-sm z-10 relative
            `}>
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight px-1">相談者リスト</h2>
                        <button 
                            onClick={toggleDeleteMode}
                            className={`p-2 rounded-xl transition-all ${isDeleteMode ? 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {isDeleteMode ? (
                        <div className="flex items-center justify-between px-2 py-2 mb-2 bg-rose-50 border border-rose-100 rounded-xl">
                             <div className="flex items-center gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={selectedForDeletion.size === filteredUsers.length && filteredUsers.length > 0} 
                                    onChange={handleSelectAll}
                                    className="w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 transition-all cursor-pointer"
                                />
                                <span className="text-xs font-black text-rose-700 uppercase tracking-widest">Select All</span>
                             </div>
                             <span className="text-[10px] font-black text-rose-400 bg-white px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-tighter">
                                {selectedForDeletion.size} Selected
                             </span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-1 mb-4">
                            <button onClick={() => setFilterStatus('all')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'all' ? 'bg-sky-600 border-sky-600 text-white shadow-md ring-4 ring-sky-100' : 'bg-white border-slate-100'}`}>
                                <p className="text-[7px] font-black uppercase opacity-70">Total</p>
                                <p className="text-xs font-black">{stats.total}</p>
                            </button>
                            <button onClick={() => setFilterStatus('high_risk')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'high_risk' ? 'bg-rose-600 border-rose-600 text-white shadow-md ring-4 ring-rose-100' : 'bg-white border-slate-100'}`}>
                                <p className="text-[7px] font-black uppercase opacity-70">Critical</p>
                                <p className="text-xs font-black">{stats.highRisk}</p>
                            </button>
                            <button onClick={() => setFilterStatus('interrupted')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'interrupted' ? 'bg-amber-600 border-amber-600 text-white shadow-md ring-4 ring-amber-100' : 'bg-white border-slate-100'}`}>
                                <p className="text-[7px] font-black uppercase opacity-70">Pause</p>
                                <p className="text-xs font-black">{stats.interrupted}</p>
                            </button>
                            <button onClick={() => setFilterStatus('no_history')} className={`p-2 rounded-xl border transition-all text-center ${filterStatus === 'no_history' ? 'bg-slate-600 border-slate-600 text-white shadow-md ring-4 ring-slate-100' : 'bg-white border-slate-100'}`}>
                                <p className="text-[7px] font-black uppercase opacity-70">New</p>
                                <p className="text-xs font-black">{stats.noHistory}</p>
                            </button>
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        <input type="text" placeholder="名前で検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
                    {filteredUsers.length > 0 ? filteredUsers.map(user => {
                        const meta = userMetadata[user.id] || { isHighRisk: false, lastDate: '', status: '', count: 0 };
                        const isSelected = isDeleteMode && selectedForDeletion.has(user.id);
                        const isCurrent = selectedUserId === user.id;

                        return (
                            <button 
                                key={user.id} 
                                onClick={() => handleUserSelect(user.id)} 
                                className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                                    isSelected ? 'bg-rose-50 border-rose-300 shadow-md ring-2 ring-rose-100' : 
                                    isCurrent ? 'bg-white border-sky-400 shadow-lg ring-1 ring-sky-500/10' : 
                                    'bg-white border-slate-100 hover:border-slate-300'
                                }`}
                            >
                                {isDeleteMode && (
                                    <div className="flex-shrink-0">
                                        <input 
                                            type="checkbox" 
                                            checked={isSelected}
                                            readOnly
                                            className="w-6 h-6 rounded-lg border-rose-300 text-rose-600 focus:ring-rose-500 pointer-events-none"
                                        />
                                    </div>
                                )}
                                
                                {meta.isHighRisk && !isDeleteMode && (
                                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">Critical</span>
                                  </div>
                                )}

                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0 ${
                                    isSelected ? 'bg-rose-500' : isCurrent ? 'bg-sky-600' : 'bg-slate-300 group-hover:bg-slate-400'
                                }`}>
                                    <UserIcon className="w-6 h-6" />
                                </div>

                                <div className="text-left overflow-hidden flex-1">
                                    <p className={`font-bold truncate text-base ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>{user.nickname}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-slate-400 font-mono truncate">{user.id}</p>
                                        <p className="text-[9px] font-black text-slate-300 uppercase shrink-0">{meta.lastDate ? new Date(meta.lastDate).toLocaleDateString() : 'NO HISTORY'}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    }) : (
                        <div className="text-center py-20 opacity-30 italic font-bold">相談者がいません</div>
                    )}
                </div>

                {isDeleteMode ? (
                    <div className="p-4 bg-white border-t space-y-3">
                         <button 
                            onClick={executeBulkDelete}
                            disabled={selectedForDeletion.size === 0}
                            className="w-full flex items-center justify-center gap-3 py-4 bg-rose-600 text-white font-black rounded-2xl shadow-xl hover:bg-rose-700 active:scale-[0.98] disabled:bg-slate-200"
                        >
                            <TrashIcon className="w-5 h-5" />
                            <span>選択した {selectedForDeletion.size} 名を削除</span>
                        </button>
                        <button 
                            onClick={toggleDeleteMode}
                            className="w-full py-3 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                        >
                            キャンセル
                        </button>
                    </div>
                ) : (
                    <div className="p-4 bg-white border-t space-y-2">
                        <button onClick={() => setIsDataModalOpen(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-xs font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 uppercase tracking-widest"><DatabaseIcon className="w-4 h-4" /> Data Manage</button>
                        <button onClick={() => setIsDevLogModalOpen(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-xs font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 uppercase tracking-widest"><LogIcon className="w-4 h-4" /> System Logs</button>
                        <button onClick={() => setIsSecurityModalOpen(true)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-xs font-black text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-100 uppercase tracking-widest"><LockIcon className="w-4 h-4" /> Security Settings</button>
                    </div>
                )}
            </aside>

            <main className={`
                ${selectedUserId ? 'flex' : 'hidden md:flex'}
                flex-1 flex-col h-full bg-white relative overflow-hidden
            `}>
                {selectedUserId ? (
                    <div className="flex-1 flex flex-col h-full">
                        <header className="sticky top-0 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md px-4 md:px-8 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <button 
                                    onClick={handleDeselectUser}
                                    className="md:hidden p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <div className="overflow-hidden">
                                    <h1 className="text-xl md:text-2xl font-black text-slate-800 truncate">{users.find(u => u.id === selectedUserId)?.nickname} さんの分析</h1>
                                    <p className="text-[10px] text-slate-400 font-mono truncate">{selectedUserId}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => runAnalysis('trajectory')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-100 text-xs sm:text-sm active:scale-95 transition-all"><TrajectoryIcon className="w-4 h-4" />軌跡分析</button>
                                <button onClick={() => runAnalysis('skillMatching')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 text-xs sm:text-sm active:scale-95 transition-all"><TargetIcon className="w-4 h-4" />適職診断</button>
                                <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 text-xs sm:text-sm"><FileTextIcon className="w-4 h-4"/> レポート出力</button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 md:py-12">
                            <div className="max-w-5xl mx-auto space-y-12">
                                <AnalysisDisplay trajectoryState={analyses.trajectory} skillMatchingState={analyses.skillMatching} />

                                <section className="space-y-6">
                                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 px-1">
                                        <div className="w-2 h-6 bg-slate-200 rounded-full"></div>
                                        セッション履歴 ({selectedUserConversations.length}件)
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {selectedUserConversations.map(conv => (
                                            <button 
                                                key={conv.id} 
                                                onClick={() => setSelectedConvForDetail(conv)}
                                                className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:border-sky-300 transition-all text-left relative"
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="text-[10px] font-black text-slate-400 font-mono">{new Date(conv.date).toLocaleString()}</div>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${conv.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{conv.status}</span>
                                                </div>
                                                <div className="prose prose-slate prose-sm line-clamp-5 text-slate-600 font-medium" dangerouslySetInnerHTML={{ __html: marked.parse(parseUserSummary(conv.summary)) }} />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
                        <div className="relative mb-8">
                            <div className="relative p-12 bg-white rounded-full shadow-2xl border border-slate-50"><UserIcon className="w-20 h-20 text-slate-200" /></div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">相談者を選択してください</h2>
                        <p className="mt-4 font-bold text-slate-400 max-w-sm mx-auto leading-relaxed">
                            左側のリストから相談者を選ぶと、AIによる詳細な分析が可能になります。
                        </p>
                    </div>
                )}
            </main>

            <AddTextModal isOpen={isAddTextModalOpen} onClose={() => setIsAddTextModalOpen(false)} onSubmit={(newConv, nick) => {
                if (nick) {
                    const currentUsers = userService.getUsers();
                    if (!currentUsers.find(u => u.id === newConv.userId)) {
                        userService.saveUsers([...currentUsers, { id: newConv.userId, nickname: nick, pin: '0000' }]);
                    }
                }
                const stored = localStorage.getItem('careerConsultations');
                let convs = [];
                if (stored) {
                    const parsed = JSON.parse(stored);
                    convs = parsed.data || (Array.isArray(parsed) ? parsed : []);
                }
                localStorage.setItem('careerConsultations', JSON.stringify({ version: 1, data: [...convs, newConv] }));
                loadData();
            }} existingUserIds={users.map(u => u.id)} />
            <DevLogModal isOpen={isDevLogModalOpen} onClose={() => setIsDevLogModalOpen(false)} />
            <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} onOpenAddText={() => setIsAddTextModalOpen(true)} onDataRefresh={loadData} />
            <SecuritySettingsModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />
            {selectedUserId && <ShareReportModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} userId={selectedUserId} conversations={selectedUserConversations} analysisCache={analyses.trajectory.data ? { trajectory: analyses.trajectory.data, skillMatching: analyses.skillMatching.data } : null} />}
            {selectedConvForDetail && <ConversationDetailModal conversation={selectedConvForDetail} onClose={() => setSelectedConvForDetail(null)} />}
            <DeleteConfirmModal isOpen={isDeleteModalOpen} count={selectedForDeletion.size} onCancel={() => setIsDeleteModalOpen(false)} onConfirm={handleFinalDelete} />
        </div>
    );
};

export default AdminView;