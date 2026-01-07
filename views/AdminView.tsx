
// views/AdminView.tsx - v3.16 - Guaranteed Build Integrity
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

const AdminView: React.FC = () => {
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [conversations, setConversations] = useState<StoredConversation[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
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

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.nickname.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const selectedUserConversations = useMemo(() => {
        return conversations.filter(c => c.userId === selectedUserId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [conversations, selectedUserId]);

    const runAnalysis = async (type: AnalysisType) => {
        if (!selectedUserId || selectedUserConversations.length === 0) return;

        setAnalyses({
            trajectory: type === 'trajectory' ? { status: 'loading', data: null, error: null } : { status: 'idle', data: null, error: null },
            skillMatching: type === 'skillMatching' ? { status: 'loading', data: null, error: null } : { status: 'idle', data: null, error: null },
            hiddenPotential: { status: 'idle', data: null, error: null }
        });

        try {
            if (type === 'trajectory') {
                const data = await analyzeTrajectory(selectedUserConversations, selectedUserId);
                setAnalyses(prev => ({ 
                    ...prev, 
                    trajectory: { status: 'success', data, error: null },
                    skillMatching: { status: 'idle', data: null, error: null }
                }));
            } else if (type === 'skillMatching') {
                const data = await performSkillMatching(selectedUserConversations);
                setAnalyses(prev => ({ 
                    ...prev, 
                    skillMatching: { status: 'success', data, error: null },
                    trajectory: { status: 'idle', data: null, error: null }
                }));
            }
        } catch (err: any) {
            setAnalyses(prev => ({ 
                ...prev, 
                [type]: { status: 'error', data: null, error: err.message || "分析エラー" } 
            }));
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
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">相談者インボックス</h2>
                    <input 
                        type="text" 
                        placeholder="名前・IDで検索" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full mt-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredUsers.map(user => (
                        <button 
                            key={user.id} 
                            onClick={() => handleUserSelect(user.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${selectedUserId === user.id ? 'bg-sky-50 border-sky-200 ring-2 ring-sky-500' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${selectedUserId === user.id ? 'bg-sky-600' : 'bg-slate-300'}`}><UserIcon /></div>
                            <div className="text-left overflow-hidden">
                                <p className="font-bold text-slate-800 truncate">{user.nickname}</p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">{user.id}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 border-t space-y-2">
                    <button onClick={() => setIsDataModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white rounded-xl transition-all"><DatabaseIcon />データ管理コンソール</button>
                    <button onClick={() => setIsDevLogModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-white rounded-xl transition-all"><LogIcon />システム開発ログ</button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">
                {selectedUserId ? (
                    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500">
                        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-widest">Expert Strategy Engine</div>
                            <div className="flex flex-wrap gap-3">
                                <button onClick={() => runAnalysis('trajectory')} className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 text-white font-bold rounded-2xl shadow-lg hover:bg-sky-700 active:scale-95 transition-all"><TrajectoryIcon />軌跡分析</button>
                                <button onClick={() => runAnalysis('skillMatching')} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 active:scale-95 transition-all"><TargetIcon />適職診断</button>
                                <button onClick={() => setIsShareModalOpen(true)} className="p-2.5 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all"><ShareIcon /></button>
                            </div>
                        </header>

                        <AnalysisDisplay trajectoryState={analyses.trajectory} skillMatchingState={analyses.skillMatching} />

                        <section className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3"><LogIcon className="w-5 h-5" /> 個別セッション履歴 (要約・引継ぎ)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedUserConversations.map(conv => (
                                    <div key={conv.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-sm font-bold text-slate-800 font-mono">{new Date(conv.date).toLocaleString()}</div>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${conv.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{conv.status}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-bold mb-4 uppercase">Handled by {conv.aiName}</p>
                                        <div className="prose prose-slate prose-sm line-clamp-4 text-slate-600" dangerouslySetInnerHTML={{ __html: marked.parse(conv.summary) }} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <div className="p-10 bg-white rounded-full shadow-inner mb-6"><UserIcon className="w-24 h-24 text-slate-200" /></div>
                        <h2 className="text-2xl font-black text-slate-800">相談者を選択してください</h2>
                        <p className="mt-2 font-medium text-slate-500">インボックスから分析対象を選択すると、<br/>専門家向けの詳細レポートが生成されます。</p>
                    </div>
                )}
            </main>

            <AddTextModal isOpen={isAddTextModalOpen} onClose={() => setIsAddTextModalOpen(false)} onSubmit={(newConv) => { const stored = localStorage.getItem('careerConsultations'); let convs = []; if (stored) convs = JSON.parse(stored).data || []; localStorage.setItem('careerConsultations', JSON.stringify({ version: 1, data: [...convs, newConv] })); loadData(); }} existingUserIds={users.map(u => u.id)} />
            <DevLogModal isOpen={isDevLogModalOpen} onClose={() => setIsDevLogModalOpen(false)} />
            <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} onOpenAddText={() => setIsAddTextModalOpen(true)} onDataRefresh={loadData} />
            {selectedUserId && <ShareReportModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} userId={selectedUserId} conversations={selectedUserConversations} analysisCache={null} />}
        </div>
    );
};

export default AdminView;
