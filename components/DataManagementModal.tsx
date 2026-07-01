
// components/DataManagementModal.tsx - v6.59 - 2026-06-30 - 詳細仕様書(SYSTEM_SPECIFICATION.md)とAI認識用の開発指示(AGENTS.md)を統合した同期更新・品質管理プロトコル(案A)の実装
import React, { useRef, useState } from 'react';
import { STORAGE_VERSION, UserInfo, StoredConversation, StoredData } from '../types';
import * as userService from '../services/userService';
import * as conversationService from '../services/conversationService';
import * as devLogService from '../services/devLogService';
import * as analysisService from '../services/analysisService';
import DatabaseIcon from './icons/DatabaseIcon';
import ExportIcon from './icons/ExportIcon';
import ImportIcon from './icons/ImportIcon';
import FileTextIcon from './icons/FileTextIcon';
import CheckIcon from './icons/CheckIcon';
import LockIcon from './icons/LockIcon';
import ImportSecurePackageModal from './ImportSecurePackageModal';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddText: () => void;
  onDataRefresh: () => void;
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose, onOpenAddText, onDataRefresh }) => {
  const MODAL_VERSION = "6.59";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSecureImportOpen, setIsSecureImportOpen] = useState(false);

  // Backup Password Modal States
  const [isExportPasswordModalOpen, setIsExportPasswordModalOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');
  const [exportError, setExportError] = useState('');

  // Restore Password Modal States
  const [isImportPasswordModalOpen, setIsImportPasswordModalOpen] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState('');
  const [importPendingPayload, setImportPendingPayload] = useState('');

  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setIsSuccess(true);
    setIsProcessing(false);
    setTimeout(() => { setIsSuccess(false); setStatusMessage(''); }, 8000);
  };

  const startExportAllProcess = () => {
    setExportPassword('');
    setExportPasswordConfirm('');
    setExportError('');
    setIsExportPasswordModalOpen(true);
  };

  const handleExportAll = async () => {
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

    setIsProcessing(true);
    setExportError('');
    try {
      const users = await userService.getUsers();
      const conversations = await conversationService.getAllConversations();
      const analysisHistory = analysisService.getAllAnalysisHistory();
      const backupData: StoredData = { 
        version: STORAGE_VERSION, 
        users, 
        data: conversations, 
        analysisHistory,
        exportedAt: new Date().toISOString() 
      };

      // Encrypt and build a standalone HTML backup package instead of raw JSON
      const { generateSecureSystemBackupHtmlPackage } = await import('../utils/exportPackage');
      const htmlContent = await generateSecureSystemBackupHtmlPackage(backupData, exportPassword);

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const { downloadFile, getLocalIsoDateString } = await import('../utils/downloadUtils');
      downloadFile(blob, `system_secure_backup_${getLocalIsoDateString()}.html`);
      setIsExportPasswordModalOpen(false);
      showStatus("暗号化システムバックアップHTMLを出力しました。");
    } catch (err: any) {
      console.error(err);
      setExportError("暗号化中にエラーが発生しました: " + (err.message || "不明"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportSystem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rawText = e.target?.result as string;
            
            // Try parsing as HTML backup package first, extracting payload
            let encryptedPayload = '';
            const containerMatch = rawText.match(/id="encrypted-backup-payload"[^>]*>([^<]+)</);
            if (containerMatch && containerMatch[1]) {
                encryptedPayload = containerMatch[1].trim();
            } else {
                const scriptMatch = rawText.match(/const\s+encryptedData\s*=\s*["']([^"']+)["']/);
                if (scriptMatch && scriptMatch[1]) {
                    encryptedPayload = scriptMatch[1].trim();
                }
            }

            if (encryptedPayload) {
                // HTML structure found and payload extracted successfully
                setImportPendingPayload(encryptedPayload);
                setImportPassword('');
                setImportError('');
                setIsImportPasswordModalOpen(true);
            } else {
                // Fallback: try parsing as legacy JSON format for backwards compatibility
                try {
                    const imported = JSON.parse(rawText);
                    if (imported && imported.isEncrypted === true && imported.payload) {
                        setImportPendingPayload(imported.payload);
                        setImportPassword('');
                        setImportError('');
                        setIsImportPasswordModalOpen(true);
                    } else {
                        // Legacy unencrypted backup import
                        setIsProcessing(true);
                        await executeImportMerge(imported);
                    }
                } catch {
                    alert("インポートに失敗しました。無効なHTMLパッケージまたはJSONファイルです。");
                }
            }
        } catch (err: any) { 
            alert("インポート中にエラーが発生しました: " + (err.message || "不明")); 
        } finally { 
            if (fileInputRef.current) fileInputRef.current.value = ''; 
        }
    };
    reader.readAsText(file);
  };

  const handleDecryptAndImport = async () => {
    if (!importPassword) {
      setImportError("パスワードを入力してください。");
      return;
    }
    setIsProcessing(true);
    setImportError('');
    try {
      const { decryptData } = await import('../utils/cryptoUtils');
      const decryptedString = await decryptData(importPendingPayload, importPassword);
      const importedData = JSON.parse(decryptedString) as StoredData;

      await executeImportMerge(importedData);
      setIsImportPasswordModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setImportError("復号に失敗しました。パスワードが正しくない可能性があります。");
      setIsProcessing(false);
    }
  };

  const executeImportMerge = async (imported: StoredData) => {
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

    if (imported.analysisHistory && Array.isArray(imported.analysisHistory)) {
        const currentHistory = analysisService.getAllAnalysisHistory();
        const historyIdSet = new Set(currentHistory.map(h => h.id));
        const uniqueNewHistory = imported.analysisHistory.filter(h => !historyIdSet.has(h.id));
        analysisService.restoreAnalysisHistory([...currentHistory, ...uniqueNewHistory]);
    }

    devLogService.addLogEntry({ type: 'audit', level: 'info', action: 'Data Import', details: `Imported ${uniqueNewConvs.length} sessions.` });
    onDataRefresh();
    showStatus(`${uniqueNewConvs.length}件の履歴を統合しました。`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[250] flex justify-center items-center p-4 backdrop-blur-sm" onClick={() => {
      if (isExportPasswordModalOpen || isImportPasswordModalOpen) return;
      onClose();
    }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white"><div className="flex items-center gap-3 text-slate-800"><DatabaseIcon className="w-6 h-6 text-sky-600" /><h2 className="text-xl font-bold tracking-tight">データ管理コンソール</h2></div><button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button></header>
        <div className="p-8 space-y-8">
          <section className="space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">System Backup & Restore</div>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={startExportAllProcess} disabled={isProcessing} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all group disabled:opacity-50"><ExportIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-600" /><span className="text-sm font-bold text-slate-700">全データ出力</span></button>
                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all group disabled:opacity-50">{isProcessing ? <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div> : <ImportIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-600" />}<span className="text-sm font-bold text-slate-700">{isProcessing ? '復元中...' : '復元・マージ'}</span></button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImportSystem} accept=".html,.json" className="hidden" />
          </section>

          <section className="space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Secure Client Handoff</div>
            <button 
                onClick={() => setIsSecureImportOpen(true)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-amber-50 border border-amber-100 hover:border-amber-500 transition-all group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                        <LockIcon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-bold text-amber-900">セキュアHTML読込</span>
                        <span className="block text-[10px] text-amber-700 font-medium">ユーザー暗号化済みファイルを復号してインポート</span>
                    </div>
                </div>
                <div className="text-amber-400 group-hover:translate-x-1 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </div>
            </button>
          </section>
          <section className="space-y-4">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Intelligent Ingestion</div>
            <button onClick={() => { onClose(); onOpenAddText(); }} disabled={isProcessing} className="w-full flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:border-emerald-500 transition-all group disabled:opacity-50"><div className="flex items-center gap-4"><div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm"><FileTextIcon /></div><div className="text-left"><span className="block text-sm font-bold text-emerald-900">外部テキストから履歴を生成</span><span className="block text-[10px] text-emerald-700 font-medium">メールログ等をAIが要約してインポート</span></div></div><div className="text-emerald-400 group-hover:translate-x-1 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg></div></button>
          </section>
          {isSuccess && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-start gap-3 animate-in fade-in"><div className="mt-0.5"><CheckIcon /></div><div className="flex-1"><span className="text-xs font-bold block">{statusMessage}</span></div></div>}
        </div>
      </div>
      
      <ImportSecurePackageModal 
        isOpen={isSecureImportOpen}
        onClose={() => setIsSecureImportOpen(false)}
        onDataRefresh={onDataRefresh}
      />

      {/* 全データ出力用パスワード設定モーダル */}
      {isExportPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300] animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-200 font-sans" onClick={e => e.stopPropagation()}>
            <div className="text-center font-sans">
              <span className="text-2xl">🔒</span>
              <h3 className="text-xl font-bold text-slate-800 mt-2 font-sans">システムバックアップ暗号化</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed font-bold">
                全システムデータを復元する際に使用するマスターパスワードを設定してください。
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">マスターパスワード（4文字以上）</label>
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
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs"
              >
                キャンセル
              </button>
              <button 
                onClick={handleExportAll}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-150 disabled:opacity-50 transition-all text-xs"
              >
                {isProcessing ? "生成中..." : "暗号化出力"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* システム復元用パスワードキー解除モーダル */}
      {isImportPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300] animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-200 font-sans" onClick={e => e.stopPropagation()}>
            <div className="text-center font-sans">
              <span className="text-2xl">🗝️</span>
              <h3 className="text-xl font-bold text-slate-800 mt-2 font-sans">パスワードを入力してください</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                このバックアップを復号するために、エクスポート時に設定されたマスターパスワードを入力してください。
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
                onClick={() => setIsImportPasswordModalOpen(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs"
              >
                キャンセル
              </button>
              <button 
                onClick={handleDecryptAndImport}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-150 transition-all text-xs"
              >
                {isProcessing ? "復元中..." : "復元する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagementModal;
