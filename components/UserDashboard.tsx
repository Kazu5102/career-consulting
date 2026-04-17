
// components/UserDashboard.tsx - v4.51 - Robust Erasure
import React, { useState, useRef } from 'react';
import { StoredConversation, STORAGE_VERSION, StoredData, UserInfo } from '../types';
import * as conversationService from '../services/conversationService';
import * as userService from '../services/userService';
import * as analysisService from '../services/analysisService';
import ConversationDetailModal from './ConversationDetailModal';
import ExportIcon from './icons/ExportIcon';
import ImportIcon from './icons/ImportIcon';
import TrashIcon from './icons/TrashIcon';
import PlayIcon from './icons/PlayIcon';
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

  const handleErasureRequest = async () => {
      if (window.confirm("【忘れられる権利の行使】全てのデータを完全に削除します。本当によろしいですか？")) {
          try {
              addLogEntry({ type: 'audit', level: 'critical', action: 'Right to Erasure Executed', details: `User ${userId} requested full data deletion.` });
              
              // ユーザー情報の削除
              await userService.deleteUsers([userId]);
              // 会話履歴の削除
              await conversationService.deleteConversationsByUserIds([userId]);
              // 分析履歴の削除 (追加)
              analysisService.deleteAnalysisHistory([userId]);
              // 一時保存データの削除
              await conversationService.clearAutoSave(userId);
              
              alert("抹消されました。");
              window.location.reload();
          } catch (error: any) {
              console.error("Erasure Error:", error);
              alert(`削除処理中にエラーが発生しました: ${error.message || '不明なエラー'}\n画面をリロードして再度お試しください。`);
          }
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
                 <button onClick={onNewChat} className="px-4 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">新規相談を開始</button>
                 <button onClick={handleExportUserData} className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all"><ExportIcon />データ出力</button>
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all"><ImportIcon />データ復元</button>
                 <input type="file" ref={fileInputRef} onChange={() => {}} accept=".json" className="hidden" />
             </div>
             <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl mb-6 flex gap-4 items-center">
                <div className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                <p className="text-[11px] text-sky-800 font-bold leading-relaxed">本システムは Protocol 2.0 に基づきデータを保護しています。いつでも全てのデータを削除することが可能です。</p>
             </div>
          </header>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            <h2 className="text-lg font-black text-slate-800 px-1">過去のセッション ({conversations.length}件)</h2>
            {conversations.map(conv => {
                // Interrupted Session: Show Resume Card
                if (conv.status === 'interrupted') {
                    return (
                        <div key={conv.id} className="w-full p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400"></div>
                            <div className="pl-3">
                                <div className="text-xs font-black text-slate-400 font-mono mb-1 uppercase tracking-widest">{new Date(conv.date).toLocaleDateString()}</div>
                                <div className="font-bold text-slate-800 text-lg">担当: {conv.aiName}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">PAUSED</span>
                                    <span className="text-xs text-slate-500 font-medium">中断されたセッション</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onResume(conv);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-600 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto justify-center"
                            >
                                <PlayIcon className="w-5 h-5" />
                                <span>相談を再開する</span>
                            </button>
                        </div>
                    );
                }
                
                // Completed Session: Show Detail Button
                return (
                    <button key={conv.id} onClick={() => setSelectedConversation(conv)} className="w-full text-left p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-sky-300 transition-all group relative overflow-hidden pl-7">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400"></div>
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-xs font-black text-slate-400 font-mono mb-1 uppercase tracking-widest">{new Date(conv.date).toLocaleDateString()}</div>
                                <div className="font-bold text-slate-800 group-hover:text-sky-700">担当: {conv.aiName}</div>
                            </div>
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600">COMPLETED</span>
                        </div>
                    </button>
                );
            })}
          </div>
      </div>
      {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} />}
      <ExportSuccessModal isOpen={isExportSuccessModalOpen} onClose={() => setIsExportSuccessModalOpen(false)} />
    </>
  );
};

export default UserDashboard;
