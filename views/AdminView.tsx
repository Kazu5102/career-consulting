
// views/AdminView.tsx - v3.21 - Terminology Alignment
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { marked } from 'marked';
import { StoredConversation, UserInfo, AnalysisType, AnalysesState } from '../types';
import * as userService from '../services/userService';
import { analyzeTrajectory, performSkillMatching } from '../services/index';

import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import AddTextModal from '../components/AddTextModal';
import DataManagementModal from '../components/DataManagementModal';
import AnalysisDisplay from '../components/AnalysisDisplay';

import UserIcon from '../components/icons/UserIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';
import TargetIcon from '../components/icons/TargetIcon';
import DatabaseIcon from '../components/icons/DatabaseIcon';
import LogIcon from '../components/icons/LogIcon';
import ShareIcon from '../components/icons/ShareIcon';
import InterruptIcon from '../components/icons/InterruptIcon';
import CheckIcon from '../components/icons/CheckIcon';

type FilterStatus = 'all' | 'completed' | 'interrupted' | 'high_risk' | 'no_history';
type SortOrder = 'desc' | 'asc';

const AdminView: React.FC = () => {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [conversations, setConversations] = useState<StoredConversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    
    const [analyses, setAnalyses] = useState<AnalysesState>({
        trajectory: { status: 'idle', data: null, error: null },
        skillMatching: { status: 'idle', data: null, error: null },
        hiddenPotential: { status: 'idle', data: null, error: null }
    });

    const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
    const [isDevLogModalOpen, setIsDevLogModalOpen] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const loadData = useCallback(() => {
        setUsers(userService.getUsers());
        const stored = localStorage.getItem('careerConsultations');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setConversations(parsed.data || (Array.isArray(parsed) ? parsed : []));
            } catch (e) { setConversations([]); }
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
                c.summary.includes('死') || 
                c.summary.includes('退職代行')
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
        (Object.values(userMetadata) as Array<{ status: string; isHighRisk: boolean; count: number }>).forEach(m => {
            if (m.status === 'interrupted') counts.interrupted++;
            if (m.isHighRisk) counts.highRisk++;
            if (m.count === 0) counts.noHistory++;
        });
        return counts;
    }, [userMetadata, users.length]);

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
            const dateA = new Date(userMetadata[a.id].lastDate).getTime() || 0;
            const dateB = new Date(userMetadata[b.id].lastDate).getTime() || 0;
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [users, searchQuery, filterStatus, sortOrder, userMetadata]);

    const selectedUserConversations = useMemo(() => {
        return conversations.filter(c => c.userId === selectedUserId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [conversations, selectedUserId]);

    const runAnalysis = async (type: AnalysisType) => {
        if (!selectedUserId) return;

        if (selectedUserConversations.length === 0) {
            setAnalyses(prev => ({ ...prev, [type]: { status: 'error', data: null, error: "履歴が1件もありません。まず相談者と対話を行い、セッションを完了させてください。" } }));
            return;
        }

        if (type === 'trajectory' && selectedUserConversations.length < 2) {
            setAnalyses(prev => ({ ...prev, trajectory: { status: 'error', data: null, error: "軌跡分析には、少なくとも2回以上のセッション履歴が必要です。" } }));
            return;
        }

        const totalCharCount = selectedUserConversations.reduce((acc, c) => acc + (c.summary?.length || 0), 0);
        if (totalCharCount < 100) {
            setAnalyses(prev => ({ ...prev, [type]: { status: 'error', data: null, error: "対話の要約内容が極端に少ないため、AIが臨床的な判断を下せません。" } }));
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
                setAnalyses(prev => ({ ...prev, trajectory: { status: 'success', data, error: null }, skillMatching: { status: 'idle', data: null, error: null } }));
            } else if (type === 'skillMatching') {
                const data = await performSkillMatching(selectedUserConversations);
                setAnalyses(prev => ({ ...prev, skillMatching: { status: 'success', data, error: null }, trajectory: { status: 'idle', data: null, error: null } }));
            }
        } catch (err: any) {
            let userError = err.message || "予期せぬエラーが発生しました。";
            if (userError.includes('SAFETY')) userError = "AIのセーフティフィルタにより分析が中断されました。";
            setAnalyses(prev => ({ ...prev, [type]: { status: 'error', data: null, error: userError } }));
        }
    };

    const handleUserSelect = (userId: string) => {
        setSelectedUserId(userId);
        setAnalyses({
            trajectory: { status: 'idle', data: null, error: null },
            skillMatching: { status: 'idle', data: null, error: null },
            hiddenPotential: { status: 'idle', data: null, error: null }
        });
    };

    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden">
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">インボックス</h2>
                    <div className="grid grid-cols-4 gap-1.5 mt-4">
                        <button onClick={() => setFilterStatus('all')} className={`p-1.5 rounded-lg border transition-all text-center ${filterStatus === 'all' ? 'bg-white border-sky-200 ring-1 ring-sky-500/20' : 'bg-white/50 border-slate-100 hover:border-slate-200'}`}>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Total</p>
                            <p className="text-sm font-black text-slate-800">{stats.total}</p>
                        </button>
                        <button onClick={() => setFilterStatus('high_risk')} className={`p-1.5 rounded-lg border transition-all text-center ${filterStatus === 'high_risk' ? 'bg-rose-50 border-rose-200 ring-1 ring-rose-500/20' : 'bg-white/50 border-slate-100 hover:border-slate-200'}`}>
                            <p className="text-[8px] font-black text-rose-500 uppercase">Risk</p>
                            <p className="text-sm font-black text-rose-600">{stats.highRisk}</p>
                        </button>
                        <button onClick={() => setFilterStatus('interrupted')} className={`p-1.5 rounded-lg border transition-all text-center ${filterStatus === 'interrupted' ? 'bg-amber-50 border-amber-200 ring-1 ring-amber-500/20' : 'bg-white/50 border-slate-100 hover:border-slate-200'}`}>
                            <p className="text-[8px] font-black text-amber-500 uppercase">Paused</p>
                            <p className="text-sm font-black text-amber-600">{stats.interrupted}</p>
                        </button>
                        <button onClick={() => setFilterStatus('no_history')} className={`p-1.5 rounded-lg border transition-all text-center ${filterStatus === 'no_history' ? 'bg-slate-100 border-slate-300 ring-1 ring-slate-400/30' : 'bg-white/50 border-slate-100 hover:border-slate-200'}`}>
                            <p className="text-[8px] font-black text-slate-500 uppercase">未対話</p>
                            <p className="text-sm font-black text-slate-600">{stats.noHistory}</p>
                        </button>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <input type="text" placeholder="検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                        <button onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
                    {filteredUsers.length > 0 ? filteredUsers.map(user => {
                        const meta = userMetadata[user.id];
                        return (
                            <button key={user.id} onClick={() => handleUserSelect(user.id)} className={`w-full group relative flex items-center gap-3 p-3 rounded-2xl transition-all border ${selectedUserId === user.id ? 'bg-white border-sky-300 shadow-md ring-1 ring-sky-500/10' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}>
                                {meta.isHighRisk && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-4 ring-rose-500/20"></div>}
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 ${selectedUserId === user.id ? 'bg-sky-600' : 'bg-slate-300 group-hover:bg-slate-400'}`}><UserIcon /></div>
                                <div className="text-left overflow-hidden flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-bold text-slate-800 truncate text-sm">{user.nickname}</p>
                                        {meta.status === 'interrupted' && <span className="shrink-0 text-amber-500" title="中断中"><InterruptIcon className="w-3 h-3" /></span>}
                                        {meta.status === 'completed' && <span className="shrink-0 text-emerald-500" title="完了"><CheckIcon className="w-3 h-3" /></span>}
                                        {meta.count === 0 && <span className="shrink-0 px-1 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded tracking-tighter">未対話</span>}
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <p className="text-[9px] text-slate-400 font-mono truncate">{user.id}</p>
                                        <p className="text-[8px] font-black text-slate-300 uppercase">{meta.lastDate ? new Date(meta.lastDate).toLocaleDateString() : '対話履歴なし'}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    }) : (
                        <div className="text-center py-10 opacity-30">
                            <p className="text-sm font-bold text-slate-500">条件に合う相談者は<br/>いません</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-white border-t space-y-2">
                    <button onClick={() => setIsDataModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest"><DatabaseIcon className="w-4 h-4" /> Data Console</button>
                    <button onClick={() => setIsDevLogModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-50 rounded-xl transition-all uppercase tracking-widest"><LogIcon className="w-4 h-4" /> System Logs</button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative bg-white">
                {selectedUserId ? (
                    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full -mr-10 -mt-10"></div>
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-black uppercase tracking-widest rounded-md">Strategy Mode</div>
                                    {userMetadata[selectedUserId].isHighRisk && <div className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-md animate-pulse">Critical Priority</div>}
                                </div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{users.find(u => u.id === selectedUserId)?.nickname} さんの分析</h1>
                                <p className="text-slate-400 text-xs mt-1 font-mono">{selectedUserId}</p>
                            </div>
                            <div className="flex flex-wrap gap-3 relative">
                                <button onClick={() => runAnalysis('trajectory')} className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-100 hover:bg-sky-700 active:scale-95 transition-all"><TrajectoryIcon className="w-5 h-5" />軌跡分析</button>
                                <button onClick={() => runAnalysis('skillMatching')} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all"><TargetIcon className="w-5 h-5" />適職診断</button>
                                <button onClick={() => setIsShareModalOpen(true)} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 transition-all shadow-sm"><ShareIcon className="w-5 h-5"/></button>
                            </div>
                        </header>

                        <AnalysisDisplay trajectoryState={analyses.trajectory} skillMatchingState={analyses.skillMatching} />

                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                    <div className="w-2 h-6 bg-slate-200 rounded-full"></div>
                                    個別セッション履歴 ({selectedUserConversations.length}件)
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedUserConversations.map(conv => (
                                    <div key={conv.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:border-slate-300 transition-all relative group">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-xs font-black text-slate-400 font-mono">{new Date(conv.date).toLocaleString()}</div>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${conv.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{conv.status}</span>
                                        </div>
                                        <p className="text-[10px] text-sky-600 font-black mb-4 uppercase tracking-tighter">Consulted by {conv.aiName}</p>
                                        <div className="prose prose-slate prose-sm line-clamp-4 text-slate-600 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(conv.summary) }} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-sky-100 rounded-full scale-150 opacity-20 animate-pulse"></div>
                            <div className="relative p-12 bg-white rounded-full shadow-2xl border border-slate-50"><UserIcon className="w-24 h-24 text-slate-200" /></div>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">インボックスから<br/>相談者を選択してください</h2>
                        <p className="mt-4 font-bold text-slate-400 max-w-sm mx-auto leading-relaxed">左側のリストから相談者を選ぶと、<br/>AIが対話の軌跡や隠れたポテンシャルを<br/>専門家（SV）の視点で分析します。</p>
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
            {selectedUserId && <ShareReportModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} userId={selectedUserId} conversations={selectedUserConversations} analysisCache={null} />}
        </div>
    );
};

export default AdminView;
