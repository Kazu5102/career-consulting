
// components/UserDashboard.tsx - v6.56 - 2026-06-30 - 詳細仕様書(SYSTEM_SPECIFICATION.md)とAI認識用の開発指示(AGENTS.md)を統合した同期更新・品質管理プロトコル(案A)の実装
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
  const DASHBOARD_VERSION = "6.03"; 
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null);
  const [isExportSuccessModalOpen, setIsExportSuccessModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Password Modal States
  const [isExportPasswordModalOpen, setIsExportPasswordModalOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');
  const [exportError, setExportError] = useState('');

  // Import Password Modal States
  const [isImportPasswordModalOpen, setIsImportPasswordModalOpen] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState('');
  const [importEncryptedPayload, setImportEncryptedPayload] = useState('');

  const startExportProcess = () => {
      if (conversations.length === 0) return;
      setExportPassword('');
      setExportPasswordConfirm('');
      setExportError('');
      setIsExportPasswordModalOpen(true);
  };

  const handleExportUserData = async () => {
      if (!exportPassword) {
          setExportError("パスワードを入力してください。");
          return;
      }
      if (exportPassword !== exportPasswordConfirm) {
          setExportError("確認用パスワードと一致しません。");
          return;
      }
      if (exportPassword.length < 4) {
          setExportError("パスワードは4文字以上で設定してください。");
          return;
      }

      setIsExporting(true);
      setExportError('');
      try {
          const userData: UserInfo = { id: userId, nickname, pin };
          const userHistory = analysisService.getAnalysisHistory(userId);
          const dataToStore: StoredData = { 
              version: STORAGE_VERSION, 
              data: conversations, 
              userInfo: userData,
              analysisHistory: userHistory
          };
          
          const { generateSecureBackupHtmlPackage } = await import('../utils/exportPackage');
          const htmlContent = await generateSecureBackupHtmlPackage(dataToStore, exportPassword);
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const { downloadFile } = await import('../utils/downloadUtils');
          
          downloadFile(blob, `career_backup_${nickname}.html`);
          setIsExportPasswordModalOpen(false);
          setIsExportSuccessModalOpen(true);
      } catch (err: any) { 
          console.error("Export Error:", err);
          setExportError("暗号化中にエラーが発生しました: " + (err.message || '不明')); 
      } finally { 
          setIsExporting(false); 
      }
  };

  const handleImportUserData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              const fileContent = e.target?.result as string;
              
              // Extract AES-GCM encrypted payload from the HTML backup
              let encryptedPayload = '';
              const containerMatch = fileContent.match(/id="encrypted-backup-payload"[^>]*>([^<]+)</);
              if (containerMatch && containerMatch[1]) {
                  encryptedPayload = containerMatch[1].trim();
              } else {
                  // Fallback match script pattern
                  const scriptMatch = fileContent.match(/const\s+encryptedData\s*=\s*["']([^"']+)["']/);
                  if (scriptMatch && scriptMatch[1]) {
                      encryptedPayload = scriptMatch[1].trim();
                  }
              }

              if (!encryptedPayload) {
                  throw new Error("アップロードされたファイルに有効な暗号化バックアップデータが見つかりませんでした。正しいバックアップファイル（.html）を指定してください。");
              }

              setImportEncryptedPayload(encryptedPayload);
              setImportError('');
              setImportPassword('');
              setIsImportPasswordModalOpen(true);
          } catch (error: any) {
              console.error("Reader Error:", error);
              alert(error.message || 'ファイルの解析に失敗しました。');
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const executeImport = async () => {
      if (!importPassword) {
          setImportError("パスワードを入力してください。");
          return;
      }
      try {
          const { decryptData } = await import('../utils/cryptoUtils');
          const decryptedStr = await decryptData(importEncryptedPayload, importPassword);
          const imported = JSON.parse(decryptedStr) as StoredData;

          if (!imported || !imported.data || !Array.isArray(imported.data)) {
              throw new Error("無効なデータ形式です。正しい履歴データが復元されませんでした。");
          }

          let targetUserId = userId;
          if (imported.userInfo) {
              const importedUser = { ...imported.userInfo };
              targetUserId = importedUser.id;
              
              const currentUsers = await userService.getUsers();
              const existingUser = currentUsers.find(u => u.id === targetUserId);
              
              // Ensure we restore a proper nickname and do not overwrite with an empty or non-human nickname
              if (!importedUser.nickname || importedUser.nickname === importedUser.id) {
                  if (existingUser && existingUser.nickname && existingUser.nickname !== existingUser.id) {
                      importedUser.nickname = existingUser.nickname;
                  } else {
                      const existingNicknames = currentUsers.map(u => u.nickname);
                      const { generateNickname } = await import('../services/userService');
                      importedUser.nickname = generateNickname(existingNicknames);
                  }
              }
              
              if (!existingUser) {
                  await userService.saveUsers([...currentUsers, importedUser]);
              } else {
                  const updatedUsers = currentUsers.map(u => u.id === targetUserId ? { ...importedUser, pin: importedUser.pin || u.pin } : u);
                  await userService.saveUsers(updatedUsers);
              }
          }

          const currentConvs = await conversationService.getAllConversations();
          const convIdSet = new Set(currentConvs.map(c => c.id));
          const importedConvs = imported.data;
          const uniqueNewConvs = importedConvs.filter(c => !convIdSet.has(c.id));
          await conversationService.replaceAllConversations([...currentConvs, ...uniqueNewConvs]);

          if (imported.analysisHistory && Array.isArray(imported.analysisHistory)) {
              const currentHistory = analysisService.getAllAnalysisHistory();
              const historyIdSet = new Set(currentHistory.map(h => h.id));
              const uniqueNewHistory = imported.analysisHistory.filter(h => !historyIdSet.has(h.id));
              analysisService.restoreAnalysisHistory([...currentHistory, ...uniqueNewHistory]);
          }

          addLogEntry({ 
              type: 'audit', 
              level: 'info', 
              action: 'User Data Import', 
              details: `User ${userId} restored file with password. Saved ${uniqueNewConvs.length} sessions.` 
          });

          alert(`データの復元が完了しました。${uniqueNewConvs.length}件のセッション履歴を統合しました。`);
          setIsImportPasswordModalOpen(false);
          window.location.reload();
      } catch (error: any) {
          console.error("Restore Error:", error);
          setImportError("パスワードが正しくないか、データが破損しているため復号できません。");
      }
  };

  const cancelImport = () => {
      setIsImportPasswordModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
                 <button onClick={startExportProcess} className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all"><ExportIcon />データ出力</button>
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-all"><ImportIcon />データ復元</button>
                 <input type="file" ref={fileInputRef} onChange={handleImportUserData} accept=".html" className="hidden" />
             </div>
             <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl mb-6 flex gap-4 items-center">
                <div className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                <p className="text-[11px] text-sky-800 font-bold leading-relaxed">本システムは Protocol 3.0 に基づきデータを保護しています。いつでも全てのデータを削除することが可能です。</p>
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
      {selectedConversation && <ConversationDetailModal conversation={selectedConversation} onClose={() => setSelectedConversation(null)} showHandoverNote={false} />}
      <ExportSuccessModal isOpen={isExportSuccessModalOpen} onClose={() => setIsExportSuccessModalOpen(false)} />

      {/* エクスポート用パスワード設定モーダル */}
      {isExportPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-200 font-sans">
            <div className="text-center font-sans">
              <span className="text-2xl">🔒</span>
              <h3 className="text-xl font-bold text-slate-800 mt-2 font-sans">バックアップ暗号化パスワード</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                このバックアップ（自己完結型HTMLファイル）を展開・復元する際に使用するパスワードを設定してください。
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">暗号化パスワード（4文字以上）</label>
                <input 
                  type="password" 
                  value={exportPassword}
                  onChange={e => setExportPassword(e.target.value)}
                  placeholder="パスワードを入力..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">確認用パスワード</label>
                <input 
                  type="password" 
                  value={exportPasswordConfirm}
                  onChange={e => setExportPasswordConfirm(e.target.value)}
                  placeholder="もう一度入力..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>
              {exportError && (
                <p className="text-xs text-rose-500 font-bold text-center bg-rose-50 p-2 rounded-lg">{exportError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsExportPasswordModalOpen(false)}
                disabled={isExporting}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs"
              >
                キャンセル
              </button>
              <button 
                onClick={handleExportUserData}
                disabled={isExporting}
                className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-150 disabled:opacity-50 transition-all text-xs"
              >
                {isExporting ? "生成中..." : "HTMLを出力"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* インポート用パスワードキー解除モーダル */}
      {isImportPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-200 font-sans">
            <div className="text-center font-sans">
              <span className="text-2xl">🗝️</span>
              <h3 className="text-xl font-bold text-slate-800 mt-2 font-sans">パスワードを入力してください</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                このバックアップを復号するために、エクスポート時にユーザー自身が設定したパスワードを入力してください。
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input 
                  type="password" 
                  value={importPassword}
                  onChange={e => setImportPassword(e.target.value)}
                  placeholder="暗号化パスワード..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-center text-lg"
                />
              </div>
              {importError && (
                <p className="text-xs text-rose-500 font-bold text-center bg-rose-50 p-2 rounded-lg">{importError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={cancelImport}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs"
              >
                キャンセル
              </button>
              <button 
                onClick={executeImport}
                className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-150 transition-all text-xs"
              >
                復元する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDashboard;
