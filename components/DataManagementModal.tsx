
// components/DataManagementModal.tsx - v4.20 - Unified Persistence Logic
import React, { useRef, useState } from 'react';
import { STORAGE_VERSION, UserInfo, StoredConversation, StoredData } from '../types';
import * as userService from '../services/userService';
import * as conversationService from '../services/conversationService';
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
    setTimeout(() => { setIsSuccess(false); setStatusMessage(''); }, 8000);
  };

  const handleExportAll = async () => {
    try {
      const users = await userService.getUsers();
      const conversations = await conversationService.getAllConversations();
      const backupData: StoredData = { version: STORAGE_VERSION, users, data: conversations, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `career_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus("データをエクスポートしました。");
    } catch { alert("エラーが発生しました。"); }
  };

  const handleImportSystem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target?.result as string) as StoredData;
            let importedUsers: UserInfo[] = imported.users || (imported.userInfo ? [imported.userInfo] : []);
            let importedConvs: StoredConversation[] = imported.data || [];
            
            const currentUsers = await userService.getUsers();
            const userIdMap = new Map(currentUsers.map(u => [u.id, u]));
            importedUsers.forEach(u => userIdMap.set(u.id, u));
            await userService.saveUsers(Array.from(userIdMap.values()));

            const currentConvs = await conversationService.getAllConversations();
            const convIdSet = new Set(currentConvs.map(c => c.id));
            const uniqueNewConvs = importedConvs.filter(c => !convIdSet.has(c.id));
            await conversationService.replaceAllConversations([...currentConvs, ...uniqueNewConvs]);

            devLogService.addLogEntry({ type: 'audit', level: 'info', action: 'Data Import', details: `Imported ${uniqueNewConvs.length} sessions.` });
            onDataRefresh();
            showStatus(`${uniqueNewConvs.length}件の履歴を統合しました。`);
        } catch { alert("インポートに失敗しました。"); } finally { setIsProcessing(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[250] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white"><div className="flex items-center gap-3 text-slate-800"><DatabaseIcon className="w-6 h-6 text-sky-600" /><h2 className="text-xl font-bold tracking-tight">データ管理コンソール</h2></div><button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></header>
        <div className="p-8 space-y-8">
          <section className="space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">System Backup & Restore</div>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleExportAll} disabled={isProcessing} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all group disabled:opacity-50"><ExportIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-600" /><span className="text-sm font-bold text-slate-700">全データ出力</span></button>
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all group disabled:opacity-50">{isProcessing ? <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div> : <ImportIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-600" />}<span className="text-sm font-bold text-slate-700">{isProcessing ? '復元中...' : '復元・マージ'}</span></button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImportSystem} accept=".json" className="hidden" />
          </section>
          <section className="space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Intelligent Ingestion</div>
            <button onClick={() => { onClose(); onOpenAddText(); }} disabled={isProcessing} className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:border-emerald-500 transition-all group disabled:opacity-50"><div className="flex items-center gap-4"><div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm"><FileTextIcon /></div><div className="text-left"><span className="block text-sm font-bold text-emerald-900">外部テキストから履歴を生成</span><span className="block text-[10px] text-emerald-700 font-medium">メールログ等をAIが要約してインポート</span></div></div><div className="text-emerald-400 group-hover:translate-x-1 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></div></button>
          </section>
          {isSuccess && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-start gap-3 animate-in fade-in"><div className="mt-0.5"><CheckIcon /></div><div className="flex-1"><span className="text-xs font-bold block">{statusMessage}</span></div></div>}
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;
