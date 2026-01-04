
// views/AdminView.tsx - v2.42 - Flexible Import Logic
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StoredConversation, StoredData, UserInfo, STORAGE_VERSION, AnalysisType, AnalysesState, UserAnalysisCache, AnalysisStateItem } from '../types';
import * as userService from '../services/userService';
import { setPassword } from '../services/authService';
import * as devLogService from '../services/devLogService';
import { analyzeTrajectory, findHiddenPotential, performSkillMatching } from '../services/index';

import ConversationDetailModal from '../components/ConversationDetailModal';
import AddTextModal from '../components/AddTextModal';
import ShareReportModal from '../components/ShareReportModal';
import DevLogModal from '../components/DevLogModal';
import AnalysisDashboard from './AnalysisDashboard';
import AnalysisDisplay from '../components/AnalysisDisplay';
import SkillMatchingModal from '../components/SkillMatchingModal';

import TrashIcon from '../components/icons/TrashIcon';
import ImportIcon from '../components/icons/ImportIcon';
import KeyIcon from '../components/icons/KeyIcon';
import UserIcon from '../components/icons/UserIcon';
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import ShareIcon from '../components/icons/ShareIcon';
import LogIcon from '../components/icons/LogIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';
import BrainIcon from '../components/icons/BrainIcon';
import TargetIcon from '../components/icons/TargetIcon';

type AdminTab = 'user' | 'comprehensive';

const initialAnalysesState: AnalysesState = {
  trajectory: { status: 'idle', data: null, error: null },
  skillMatching: { status: 'idle', data: null, error: null },
  hiddenPotential: { status: 'idle', data: null, error: null },
};


const PasswordManager: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const result = setPassword(newPassword, currentPassword);
        if (result.success) {
            setMessage({ type: 'success', text: result.message });
            setCurrentPassword('');
            setNewPassword('');
        } else {
            setMessage({ type: 'error', text: result.message });
        }
        setTimeout(() => setMessage(null), 4000);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><KeyIcon /> パスワード変更</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input type="password" placeholder="現在のパスワード" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-md" required />
                <input type="password" placeholder="新しいパスワード" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 border rounded-md" required />
                <button type="submit" className="w-full bg-slate-600 text-white px-3 py-2 rounded-md hover:bg-slate-700">変更</button>
                {message && <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>}
            </form>
        </div>
    );
};

const UserManagementPanel: React.FC<{
    allUsers: UserInfo[],
    selectedUserId: string | null,
    onUserSelect: (userId: string) => void,
    conversationsByUser: Record<string, StoredConversation[]>,
}> = ({ allUsers, selectedUserId, onUserSelect, conversationsByUser }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-2">相談者一覧 ({allUsers.length}名)</h2>
        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {allUsers.map(user => (
                <button key={user.id} onClick={() => onUserSelect(user.id)} className={`w-full text-left p-3 rounded-md transition-colors flex items-center gap-3 ${selectedUserId === user.id ? 'bg-sky-100 ring-2 ring-sky-500' : 'hover:bg-slate-100'}`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><UserIcon /></div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-slate-700 truncate" title={user.nickname}>{user.nickname}</p>
                        <p className="text-xs text-slate-500">{conversationsByUser[user.id]?.length || 0}件の相談</p>
                    </div>
                </button>
            ))}
            {allUsers.length === 0 && <p className="text-sm text-slate-500 text-center p-4">ユーザーデータがありません。</p>}
        </div>
    </div>
);


const AdminView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('user');
    const [allConversations, setAllConversations] = useState<StoredConversation[]>([]);
    const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
    const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
    const [userToShare, setUserToShare] = useState<UserInfo | null>(null);
    const [isDevLogModalOpen, setIsDevLogModalOpen] = useState(false);
    const [isMatchingModalOpen, setIsMatchingModalOpen] = useState(false);

    const [analysesState, setAnalysesState] = useState<AnalysesState>(initialAnalysesState);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        } else { setAllConversations([]); }
        if (users.length > 0 && !users.some(u => u.id === selectedUserId)) setSelectedUserId(users[0]?.id || null);
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

    const handleImportClick = () => fileInputRef.current?.click();

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') return;
                const imported = JSON.parse(text);
                const importedConvs = Array.isArray(imported) ? imported : (imported.data || []);
                
                if (!Array.isArray(importedConvs)) throw new Error("Invalid format");

                const existingIds = new Set(allConversations.map(c => c.id));
                const newConversations = importedConvs.filter((c: any) => !existingIds.has(c.id));
                const updatedConversations = [...allConversations, ...newConversations];
                
                localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updatedConversations }));
                alert(`${newConversations.length}件の履歴を統合しました。`);
                loadData();
            } catch (error) {
                alert(`インポートに失敗しました。正しいJSONファイルを選択してください。`);
            } finally {
                if(event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };
    
    const handleRunAnalysis = async (type: AnalysisType, conversations: StoredConversation[], userId: string) => {
      if (conversations.length === 0) {
          alert("履歴がありません。");
          return;
      }
      setAnalysesState(prev => ({ ...prev, [type]: { status: 'loading', data: prev[type].data, error: null } }));
      if (type === 'skillMatching') setIsMatchingModalOpen(true);
      try {
          let result;
          if (type === 'trajectory') result = await analyzeTrajectory(conversations, userId);
          else if (type === 'skillMatching') result = await performSkillMatching(conversations);
          else if (type === 'hiddenPotential') result = await findHiddenPotential(conversations, userId);
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'success', data: result, error: null } }));
      } catch (err) {
          setAnalysesState(prev => ({ ...prev, [type]: { status: 'error', data: prev[type].data, error: "分析に失敗しました。" } }));
      }
    };

    const handleClearAllData = () => {
        if (window.confirm("全データを削除しますか？")) {
            localStorage.removeItem('careerConsultations');
            localStorage.removeItem('careerConsultingUsers_v1');
            devLogService.clearLogs();
            setAllConversations([]);
            setAllUsers([]);
            setSelectedUserId(null);
            alert("削除しました。");
        }
    };

    const handleClearUserData = (userId: string) => {
        if (window.confirm(`この相談者の全履歴を削除しますか？`)) {
            const updated = allConversations.filter(c => c.userId !== userId);
            localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updated }));
            loadData();
        }
    };
    
    const handleAddTextSubmit = (newConversation: StoredConversation) => {
        const updated = [...allConversations, newConversation];
        localStorage.setItem('careerConsultations', JSON.stringify({ version: STORAGE_VERSION, data: updated }));
        if (!allUsers.some(u => u.id === newConversation.userId)) {
            userService.saveUsers([...allUsers, { id: newConversation.userId, nickname: ` imported_${newConversation.userId}`, pin: '0000'}]);
        }
        loadData();
        setIsAddTextModalOpen(false);
        setSelectedUserId(newConversation.userId);
    };
    
    const selectedUserConversations = selectedUserId ? (conversationsByUser[selectedUserId] || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
    const isAnyAnalysisLoading = Object.values(analysesState).some((s: AnalysisStateItem<unknown>) => s.status === 'loading');
    
    const convertStateToCacheForReport = (state: AnalysesState): UserAnalysisCache => {
        const cache: UserAnalysisCache = {};
        if (state.trajectory.status === 'success' && state.trajectory.data) cache.trajectory = state.trajectory.data;
        if (state.skillMatching.status === 'success' && state.skillMatching.data) cache.skillMatching = state.skillMatching.data;
        if (state.hiddenPotential.status === 'success' && state.hiddenPotential.data) cache.hiddenPotential = state.hiddenPotential.data;
        return cache;
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-2xl border border-slate-200 my-4 md:my-6 min-h-[80vh]">
            <header className="pb-4 border-b border-slate-200 mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">管理者ダッシュボード</h1>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                        <button onClick={() => setActiveTab('user')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'user' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>個別分析</button>
                        <button onClick={() => setActiveTab('comprehensive')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'comprehensive' ? 'bg-sky-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>全体分析</button>
                    </div>
                    <button onClick={() => setIsDevLogModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 p-2 rounded-lg text-sm text-white shadow-md"><LogIcon /></button>
                </div>
            </header>

            {activeTab === 'user' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <aside className="lg:col-span-4 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 transition-all"><ImportIcon /> 読込</button>
                            <button onClick={() => setIsAddTextModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-600 transition-all"><PlusCircleIcon /> 追加</button>
                            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                        </div>
                        <UserManagementPanel allUsers={allUsers} selectedUserId={selectedUserId} onUserSelect={setSelectedUserId} conversationsByUser={conversationsByUser} />
                        <PasswordManager />
                        <button onClick={handleClearAllData} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-all"><TrashIcon /> 全削除</button>
                    </aside>

                    <main className="lg:col-span-8">
                        {selectedUserId ? (
                           <div className="bg-slate-50 rounded-lg border border-slate-200 h-full flex flex-col">
                                <div className="p-4 border-b border-slate-200">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                                        <h2 className="text-xl font-bold text-slate-800">相談者の詳細分析</h2>
                                        <div className="flex gap-2">
                                            <button onClick={() => setUserToShare(allUsers.find(u => u.id === selectedUserId) || null)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"><ShareIcon /> 共有</button>
                                            <button onClick={() => handleClearUserData(selectedUserId)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"><TrashIcon /> 削除</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        {(['trajectory', 'skillMatching', 'hiddenPotential'] as AnalysisType[]).map(type => (
                                            <button key={type} onClick={() => handleRunAnalysis(type, selectedUserConversations, selectedUserId)} disabled={isAnyAnalysisLoading || selectedUserConversations.length === 0} className="flex items-center justify-center gap-2 p-2 text-sm font-semibold rounded-md transition-colors bg-white border hover:bg-slate-100 disabled:bg-slate-200">
                                                {type === 'trajectory' ? <TrajectoryIcon /> : type === 'skillMatching' ? <TargetIcon /> : <BrainIcon />}
                                                <span>{type === 'trajectory' ? '軌跡' : type === 'skillMatching' ? '適性' : '可能性'}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto">
                                    <AnalysisDisplay trajectoryState={analysesState.trajectory} hiddenPotentialState={analysesState.hiddenPotential} />
                                </div>
                           </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center">
                                <UserIcon />
                                <h2 className="mt-2 font-semibold">相談者を選択してください</h2>
                            </div>
                        )}
                    </main>
                </div>
            ) : (
                <AnalysisDashboard conversations={allConversations} />
            )}
            {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
            <AddTextModal isOpen={isAddTextModalOpen} onClose={() => setIsAddTextModalOpen(false)} onSubmit={handleAddTextSubmit} existingUserIds={allUsers.map(u => u.id)} />
            {userToShare && <ShareReportModal isOpen={!!userToShare} onClose={() => setUserToShare(null)} userId={userToShare.id} conversations={conversationsByUser[userToShare.id] || []} analysisCache={convertStateToCacheForReport(analysesState)} />}
            <DevLogModal isOpen={isDevLogModalOpen} onClose={() => setIsDevLogModalOpen(false)} />
            <SkillMatchingModal isOpen={isMatchingModalOpen} onClose={() => setIsMatchingModalOpen(false)} analysisState={analysesState.skillMatching} />
        </div>
    );
};

export default AdminView;
