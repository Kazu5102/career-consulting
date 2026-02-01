
// components/AddTextModal.tsx - v4.44 - Security Validation Added
import React, { useState, useEffect } from 'react';
import { StoredConversation } from '../types';
import { generateSummaryFromText } from '../services/index';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface AddTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newConversation: StoredConversation, nickname?: string) => void;
  existingUserIds: string[];
}

// Keywords that indicate the text is likely an encrypted report file source code
const INVALID_KEYWORDS = [
    "レポート閲覧認証",
    "Unlock Report",
    "高度に暗号化されています",
    "Protocol 2.0 Security Verified",
    "encryptedData =",
    "decryptData"
];

const AddTextModal: React.FC<AddTextModalProps> = ({ isOpen, onClose, onSubmit, existingUserIds }) => {
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState(''); 
  const [isNewUser, setIsNewUser] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTextToAnalyze('');
      setUserId('');
      setNickname('');
      setError('');
      setIsNewUser(existingUserIds.length === 0);
      if (existingUserIds.length > 0) {
        setUserId(existingUserIds[0]);
      }
    }
  }, [isOpen, existingUserIds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textToAnalyze.trim() || !userId.trim()) {
      setError('テキストと相談者IDの両方を入力してください。');
      return;
    }
    if (isNewUser && !nickname.trim()) {
        setError('新しい相談者の場合はニックネームを入力してください。');
        return;
    }

    // Validation Check: Prevent importing encrypted HTML source
    const hasInvalidKeyword = INVALID_KEYWORDS.some(kw => textToAnalyze.includes(kw));
    if (hasInvalidKeyword) {
        setError('エラー: 暗号化されたレポートファイル（HTMLソース）が含まれています。インポートできません。');
        return;
    }

    setError('');
    setIsLoading(true);
    try {
      const summary = await generateSummaryFromText(textToAnalyze);
      const newConversation: StoredConversation = {
        id: Date.now(),
        userId: userId.trim(),
        aiName: 'テキストインポート',
        aiType: 'human',
        aiAvatar: 'human_female_1',
        messages: [],
        summary: summary,
        date: new Date().toISOString(),
        status: 'completed',
      };
      onSubmit(newConversation, isNewUser ? nickname.trim() : undefined);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーです。';
      setError(`処理中にエラーが発生しました: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">テキストから履歴を追加</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-id-select" className="block text-sm font-bold text-slate-700 mb-2">相談者ID</label>
                <select 
                  id="user-id-select"
                  value={isNewUser ? 'new' : userId} 
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setIsNewUser(true);
                      setUserId('');
                    } else {
                      setIsNewUser(false);
                      setUserId(e.target.value);
                    }
                  }}
                  className="p-2 border border-slate-300 rounded-md bg-white w-full h-[42px]"
                  disabled={existingUserIds.length === 0}
                >
                  {existingUserIds.map(id => <option key={id} value={id}>{id}</option>)}
                  <option value="new">新しい相談者として追加</option>
                </select>
                {isNewUser && (
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="ID (例: user_123)"
                    className="mt-2 w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                )}
              </div>
              {isNewUser && (
                <div>
                    <label htmlFor="user-nickname" className="block text-sm font-bold text-slate-700 mb-2">ニックネーム</label>
                    <input
                      id="user-nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="表示名を入力"
                      className="w-full p-2 h-[42px] bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="text-to-analyze" className="block text-sm font-bold text-slate-700 mb-2">
                履歴に追加するテキスト
              </label>
              <textarea
                id="text-to-analyze"
                value={textToAnalyze}
                onChange={(e) => setTextToAnalyze(e.target.value)}
                rows={8}
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="ここにWebサイトやドキュメントからコピーしたテキストを貼り付けてください。AIが内容を要約し、相談履歴として整形します。"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md font-bold border border-red-100">{error}</p>}
          </div>

          <footer className="p-5 bg-slate-50 border-t border-slate-200 mt-auto">
            <button
              type="submit"
              disabled={isLoading || !textToAnalyze.trim() || !userId.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-lg rounded-lg transition-colors duration-200 bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <PlusCircleIcon />
                  AIで解析して履歴に追加
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddTextModal;
