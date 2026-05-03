
// components/ImportSecurePackageModal.tsx - v1.0.0 - Patent-Compliant Secure Import
import React, { useState, useRef } from 'react';
import DatabaseIcon from './icons/DatabaseIcon';
import LockIcon from './icons/LockIcon';
import ImportIcon from './icons/ImportIcon';
import { decryptData } from '../utils/cryptoUtils';
import * as userService from '../services/userService';
import * as conversationService from '../services/conversationService';

interface ImportSecurePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefresh: () => void;
}

const ImportSecurePackageModal: React.FC<ImportSecurePackageModalProps> = ({ isOpen, onClose, onDataRefresh }) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
        setFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!fileContent || !password) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
        // Extract encrypted data from the HTML file
        const match = fileContent.match(/const encryptedData = "([^"]+)";/);
        if (!match) throw new Error("無効なファイル形式です。セルフコンテインドHTMLを選択してください。");

        const encryptedData = match[1];
        const decryptedStr = await decryptData(encryptedData, password);
        const data = JSON.parse(decryptedStr);

        // data looks like { meta: { userId, aiAgent, ... }, summary, chatHistory }
        const { meta, summary, chatHistory } = data;
        
        // 1. Ensure user exists
        const currentUsers = await userService.getUsers();
        if (!currentUsers.find(u => u.id === meta.userId)) {
            await userService.saveUsers([...currentUsers, { id: meta.userId, nickname: meta.userId, pin: '0000' }]);
        }

        // 2. Save conversation
        const conversation = {
            id: Date.now(), // Generate new ID to avoid collisions
            userId: meta.userId,
            aiName: meta.aiAgent,
            aiType: 'human' as any, // Default to human if not specified or dynamic
            aiAvatar: '',
            messages: chatHistory,
            summary: typeof summary === 'string' ? summary : JSON.stringify(summary),
            date: meta.generatedAt,
            status: 'completed' as const
        };

        await conversationService.saveConversation(conversation);
        onDataRefresh();
        onClose();
        alert("インポートが完了しました。");
    } catch (err: any) {
        setErrorMsg("復号に失敗しました。パスワードが間違っているか、ファイルが破損しています。");
        console.error(err);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[300] flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-3 text-slate-800">
                <LockIcon className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-bold tracking-tight text-slate-800">セキュアパッケージ読込</h2>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </header>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-bold text-slate-600">暗号化されたHTML対話データをインポートします。</p>
            <p className="text-[10px] text-slate-400 font-medium">※ユーザー本人から共有されたパスワードが必要です。</p>
          </div>

          <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${fileName ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-sky-400 bg-slate-50'}`}
              >
                  {fileName ? (
                      <div className="text-center">
                          <p className="text-xs font-black text-emerald-600 uppercase">Selected</p>
                          <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{fileName}</p>
                      </div>
                  ) : (
                      <>
                        <ImportIcon className="w-8 h-8 text-slate-300" />
                        <span className="text-xs font-bold text-slate-500">HTMLファイルをアップロード</span>
                      </>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".html" className="hidden" />
              </div>

              {fileContent && (
                  <div className="space-y-3 animate-in fade-in duration-500">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest pl-1">パスワード</label>
                      <input 
                        type="password" 
                        placeholder="復号パスワードを入力..." 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 bg-slate-100 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-500/20 text-center font-bold"
                      />
                      {errorMsg && <p className="text-xs text-rose-500 font-bold text-center">{errorMsg}</p>}
                  </div>
              )}
          </div>

          <button 
            disabled={!fileContent || !password || isProcessing}
            onClick={handleImport}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-black disabled:bg-slate-300 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <DatabaseIcon className="w-5 h-5" />}
            {isProcessing ? '復号中...' : 'データを統合する'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSecurePackageModal;
