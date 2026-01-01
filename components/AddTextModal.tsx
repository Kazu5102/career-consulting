import React, { useState, useEffect } from 'react';
import { StoredConversation } from '../types';
import { generateSummaryFromText } from '../services/index';
import PlusCircleIcon from './icons/PlusCircleIcon';

interface AddTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newConversation: StoredConversation) => void;
  existingUserIds: string[];
}

const AddTextModal: React.FC<AddTextModalProps> = ({ isOpen, onClose, onSubmit, existingUserIds }) => {
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [userId, setUserId] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTextToAnalyze('');
      setUserId('');
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
        // FIX: Added missing 'status' property to conform to StoredConversation type.
        status: 'completed',
      };
      onSubmit(newConversation);
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
            <div>
              <label htmlFor="user-id-select" className="block text-sm font-bold text-slate-700 mb-2">相談者ID</label>
              <div className="flex items-center gap-2">
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
                  className="p-2 border border-slate-300 rounded-md bg-white w-full"
                  disabled={existingUserIds.length === 0}
                >
                  {existingUserIds.map(id => <option key={id} value={id}>{id}</option>)}
                  <option value="new">新しい相談者として追加</option>
                </select>
              </div>
              {isNewUser && (
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="新しい相談者IDを入力 (例: user_123)"
                  className="mt-2 w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
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
                rows={10}
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="ここにWebサイトやドキュメントからコピーしたテキストを貼り付けてください。AIが内容を要約し、相談履歴として整形します。"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</p>}
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
                  <span>処理中...</span>
                </>
              ) : (
                <>
                  <PlusCircleIcon />
                  AIで要約して履歴に追加
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