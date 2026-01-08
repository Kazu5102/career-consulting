
// components/DataManagementModal.tsx - v3.20 - Intelligent Merge & Audit Logging
import React, { useRef, useState } from 'react';
import { STORAGE_VERSION, UserInfo, StoredConversation, StoredData } from '../types';
import * as userService from '../services/userService';
import * as devLogService from '../services/devLogService';
import DatabaseIcon from './icons/DatabaseIcon';
import ExportIcon from './icons/ExportIcon';
import ImportIcon from './icons/ImportIcon';
import FileTextIcon from './icons/FileTextIcon';
import CheckIcon from './icons/CheckIcon';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddText: () => void;
  onDataRefresh: () => void;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose, onOpenAddText, onDataRefresh }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setIsSuccess(true);
    setIsProcessing(false);
    setTimeout(() => {
        setIsSuccess(false);
        setStatusMessage('');
    }, 8000);
  };

  const handleExportAll = () => {
    try {
      const users = userService.getUsers();
      const allDataRaw = localStorage.getItem('careerConsultations');
      let conversations = [];
      if (allDataRaw) {
        try {
          const parsed = JSON.parse(allDataRaw);
          conversations = parsed.data || (Array.isArray(parsed) ? parsed : []);
        } catch(e) { conversations = []; }
      }

      const backupData: StoredData = {
        version: STORAGE_VERSION,
        users,
        data: conversations,
        exportedAt: new Date().toISOString() // Traceability
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `career_system_all_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus("全システムデータをエクスポートしました。");
    } catch (e) {
      alert("エクスポート中にエラーが発生しました。");
    }
  };

  const handleImportSystem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onerror = () => {
      alert("ファイルの読み込み中にエラーが発生しました。");
      setIsProcessing(false);
    };

    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string') throw new Error("不正なファイル形式です。");
            
            const imported = JSON.parse(text) as StoredData;
            let importedUsers: UserInfo[] = [];
            let importedConvs: StoredConversation[] = [];

            // 1. Data Normalization
            if (Array.isArray(imported)) {
                importedConvs = imported;
            } else if (typeof imported === 'object' && imported !== null) {
                if (Array.isArray(imported.data)) importedConvs = imported.data;
                else if (Array.isArray((imported as any).conversations)) importedConvs = (imported as any).conversations;
                
                if (Array.isArray(imported.users)) importedUsers = imported.users;
                if (imported.userInfo) importedUsers.push(imported.userInfo);
            }

            if (importedConvs.length === 0 && importedUsers.length === 0) {
                throw new Error("インポート可能なデータが見つかりませんでした。");
            }

            // 2. Intelligent User Merge (Conflict Resolution)
            const currentUsers = userService.getUsers();
            const userIdMap = new Map(currentUsers.map(u => [u.id, u]));
            let userUpdateCount = 0;
            
            importedUsers.forEach(u => {
                if (u.id) {
                    if (userIdMap.has(u.id)) {
                        const existing = userIdMap.get(u.id)!;
                        if (existing.nickname !== u.nickname || existing.pin !== u.pin) {
                            userIdMap.set(u.id, { ...existing, nickname: u.nickname, pin: u.pin });
                            userUpdateCount++;
                        }
                    } else {
                        userIdMap.set(u.id, u);
                    }
                }
            });

            // Auto-fill Missing Users from Conversations
            importedConvs.forEach(c => {
                if (c.userId && !userIdMap.has(c.userId)) {
                    userIdMap.set(c.userId, {
                        id: c.userId,
                        nickname: `復元_${c.userId.slice(-4)}`,
                        pin: '0000'
                    });
                }
            });
            userService.saveUsers(Array.from(userIdMap.values()));

            // 3. Intelligent Conversation Merge (Deduplication)
            const rawCurrent = localStorage.getItem('careerConsultations');
            let currentConvs: StoredConversation[] = [];
            if (rawCurrent) {
                const parsed = JSON.parse(rawCurrent);
                currentConvs = parsed.data || (Array.isArray(parsed) ? parsed : []);
            }

            const convIdSet = new Set(currentConvs.map(c => c.id));
            const uniqueNewConvs = importedConvs.filter(c => c.id && !convIdSet.has(c.id));
            
            const finalData: StoredData = {
                version: STORAGE_VERSION,
                data: [...currentConvs, ...uniqueNewConvs]
            };

            localStorage.setItem('careerConsultations', JSON.stringify(finalData));

            // 4. Audit Logging
            devLogService.addLogEntry({
                userPrompt: `System Data Restore/Merge (Source: ${file.name})`,
                aiSummary: `データ復元・統合を実行しました。
- インポート元の出力時期: ${imported.exportedAt || '不明'}
- 新規追加された対話履歴: ${uniqueNewConvs.length}件
- スキップされた重複履歴: ${importedConvs.length - uniqueNewConvs.length}件
- 更新されたユーザー情報: ${userUpdateCount}件`
            });

            onDataRefresh();
            showStatus(`${uniqueNewConvs.length}件の新規履歴を統合しました。`);
        } catch (error: any) {
            alert(`インポート失敗: ${error.message}`);
            setIsProcessing(false);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[250] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
          <div className="flex items-center gap-3 text-slate-800">
            <DatabaseIcon className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold tracking-tight">データ管理コンソール</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              System Backup & Restore
            </div>
            <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleExportAll}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all group disabled:opacity-50"
                >
                    <ExportIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-600" />
                    <span className="text-sm font-bold text-slate-700">全データ出力</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all group relative disabled:opacity-50"
                >
                    {isProcessing ? (
                        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <ImportIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-600" />
                    )}
                    <span className="text-sm font-bold text-slate-700">{isProcessing ? '復元中...' : '復元・マージ'}</span>
                </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImportSystem} accept=".json" className="hidden" />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              AI Intelligent Ingestion
            </div>
            <button 
              onClick={() => { onClose(); onOpenAddText(); }}
              disabled={isProcessing}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:border-emerald-500 hover:bg-emerald-100 transition-all group disabled:opacity-50"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm"><FileTextIcon /></div>
                    <div className="text-left">
                        <span className="block text-sm font-bold text-emerald-900">外部テキストから履歴を生成</span>
                        <span className="block text-[10px] text-emerald-700 font-medium">メール等のログをAIが要約してインポート</span>
                    </div>
                </div>
                <div className="text-emerald-400 group-hover:translate-x-1 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </div>
            </button>
          </section>

          {isSuccess && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="mt-0.5"><CheckIcon /></div>
                <div className="flex-1">
                    <span className="text-xs font-bold leading-tight block">{statusMessage}</span>
                    <span className="text-[10px] opacity-70 block mt-1">システムが最新の状態に更新されました。</span>
                </div>
            </div>
          )}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              ※バックアップファイルには機密性の高い個人情報が含まれます。
            </p>
        </footer>
      </div>
    </div>
  );
};

export default DataManagementModal;
