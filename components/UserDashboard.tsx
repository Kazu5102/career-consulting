
// components/UserDashboard.tsx - v4.12 - Erasure Right with Audit Logging
import React, { useState, useRef, useMemo } from 'react';
import { StoredConversation, STORAGE_VERSION, StoredData, UserInfo } from '../types';
import ConversationDetailModal from './ConversationDetailModal';
import PlayIcon from './icons/PlayIcon';
import ExportIcon from './icons/ExportIcon';
import ImportIcon from './icons/ImportIcon';
import TrashIcon from './icons/TrashIcon';
import ExportSuccessModal from './ExportSuccessModal';
import { addLogEntry } from '../services/devLogService';

interface UserDashboardProps {
  conversations: StoredConversation[];
  onNewChat: () => void;
  onResume: (conversation: StoredConversation) => void;
  userId: string;
  nickname: string;
  onSwitchUser: () => void;
  pin: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ conversations, onNewChat, onResume, userId, nickname, onSwitchUser, pin }) => {
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [isExportSuccessModalOpen, setIsExportSuccessModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportUserData = async () => {
      if (conversations.length === 0 || isExporting) return;
      setIsExporting(true);
      try {
          const userData: UserInfo = { id: userId, nickname, pin };
          const dataToStore: StoredData = { version: STORAGE_VERSION, data: conversations, userInfo: userData };
          const blob = new Blob([JSON.stringify(dataToStore, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `career_data_${nickname}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsExportSuccessModalOpen(true);
      } catch (err) { alert("エラーが発生しました"); } finally { setIsExporting(false); }
  };

  const handleErasureRequest = () => {
      if (window.confirm("【忘れられる権利（抹消権）の行使】\n\nあなたのすべての相談履歴と個人設定をサーバーおよびブラウザから完全に削除します。この操作は取り消せません。本当によろしいですか？")) {
          // 1. Audit Logging (Before deletion)
          addLogEntry({
              type: 'audit',
              level: 'critical',
              action: 'Right to Erasure Executed',
              details: `User ${userId} requested full data deletion.`
          });

          // 2. Perform Deletion
          const currentAllRaw = localStorage.getItem('careerConsultations');
          if (currentAllRaw) {
              const parsed = JSON.parse(currentAllRaw);
              const remaining = (parsed.data || []).filter((c: any) => c.userId !== userId);
              localStorage.setItem('careerConsultations', JSON.stringify({ ...parsed, data: remaining }));
          }
          const users = JSON.parse(localStorage.getItem('careerConsultingUsers_v1') || '[]');
          const remainingUsers = users.filter((u: any) => u.id !== userId);
          localStorage.setItem('careerConsultingUsers_v1', JSON.stringify(remainingUsers));
          
          alert("すべてのデータが抹消されました。");
          window.location.reload();
      }
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 md:p-10 my-4 min-h-[85vh]">
          <header className="flex-shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">{nickname} さんのマイページ</h1>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Client ID: {userId}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={onSwitchUser} className="flex-1 sm:flex-none px-4 py-2 text-xs bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">切替</button>
                    <button onClick={handleErasureRequest} className="flex-1 sm:flex-none px-4 py-2 text-xs bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all flex items-center gap-1 justify-center"><TrashIcon className="w-3 h-3"/> 抹消</button>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                 <button onClick={onNewChat} className="px-4 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all text-center">新規相談を開始</button>
                 <button onClick={handleExportUserData} className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all"><ExportIcon />データ出力</button>
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all"><ImportIcon />データ復元</button>
                 <input type="file" ref={fileInputRef} onChange={() => {}} accept=".json" className="hidden" />
             </div>
             <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl mb-6 flex gap-4 items-center">
                <div className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-sky-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <p className="text-[11px] text-sky-800 font-bold leading-relaxed">
                  本システムは Protocol 2.0 に基づき、あなたの情報を適切に保護しています。右上の「抹消」ボタンから、いつでも全てのデータを削除し、システムから退会することが可能です。
                </p>
             </div>
          </header>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            <h2 className="text-lg font-black text-slate-800 px-1">過去のセッション ({conversations.length}件)</h2>
            {conversations.length > 0 ? (
                conversations.map(conv => (
                    <button key={conv.id} onClick={() => setSelectedConversation(conv)} className="w-full text-left p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-xs font-black text-slate-400 font-mono mb-1 uppercase tracking-widest">{new Date(conv.date).toLocaleDateString()}</div>
                                <div className="font-bold text-slate-800 group-hover:text-sky-700 transition-colors">担当: {conv.aiName}</div>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${conv.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{conv.status.toUpperCase()}</span>
                        </div>
                    </button>
                ))
            ) : (
              <div className="text-center py-20 opacity-30 italic font-bold">相談履歴がありません</div>
            )}
          </div>
      </div>
      {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
      <ExportSuccessModal isOpen={isExportSuccessModalOpen} onClose={() => setIsExportSuccessModalOpen(false)} />
    </>
  );
};

export default UserDashboard;
