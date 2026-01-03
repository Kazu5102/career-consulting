
import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import EditIcon from './icons/EditIcon';
import SaveIcon from './icons/SaveIcon';
import { StructuredSummary } from '../types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string; // This can now be a JSON string
  isLoading: boolean;
  onRevise: (correctionRequest: string) => void;
  onFinalize: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary, isLoading, onRevise, onFinalize }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [correctionRequest, setCorrectionRequest] = useState('');
  const [activeTab, setActiveTab] = useState<'user' | 'pro'>('user');

  // Parse the summary if it's JSON
  const parsedSummary = useMemo((): StructuredSummary => {
    try {
      if (!summary) return { user_summary: '', pro_notes: '' };
      const parsed = JSON.parse(summary);
      if (parsed.user_summary && parsed.pro_notes) return parsed;
      // Fallback for plain string summaries
      return { user_summary: summary, pro_notes: '※この履歴には専門家向けの詳細ノートが含まれていません。' };
    } catch (e) {
      return { user_summary: summary, pro_notes: '※この履歴には専門家向けの詳細ノートが含まれていません。' };
    }
  }, [summary]);

  useEffect(() => {
    if (!isOpen) {
      setIsCopied(false);
      setIsEditing(false);
      setCorrectionRequest('');
      setActiveTab('user');
    }
  }, [isOpen]);
  
  const currentContent = activeTab === 'user' ? parsedSummary.user_summary : parsedSummary.pro_notes;

  const handleCopy = () => {
    if (currentContent && !isLoading) {
      navigator.clipboard.writeText(currentContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('コピーに失敗しました。');
      });
    }
  };

  const handleRevisionSubmit = async () => {
    if (!correctionRequest.trim() || isLoading) return;
    await onRevise(correctionRequest);
    setIsEditing(false);
    setCorrectionRequest('');
  };

  const createMarkup = (markdownText: string) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'サマリーの修正依頼' : '相談内容のサマリー'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        {!isEditing && !isLoading && (
          <div className="flex bg-slate-100 p-1 mx-6 mt-4 rounded-xl border border-slate-200 flex-shrink-0">
            <button 
              onClick={() => setActiveTab('user')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'user' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              自分へのまとめ
            </button>
            <button 
              onClick={() => setActiveTab('pro')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'pro' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              プロへの共有用
            </button>
          </div>
        )}

        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
               <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-semibold text-center">{isEditing ? 'AIがサマリーを修正しています...' : 'AIが対話内容を要約しています...'}</p>
              <p className="text-sm text-slate-500">しばらくお待ちください</p>
            </div>
          ) : isEditing ? (
             <div className="space-y-4">
              <div>
                <label htmlFor="correction-request" className="block text-sm font-bold text-slate-700 mb-2">修正内容を具体的に入力してください</label>
                <textarea
                  id="correction-request"
                  value={correctionRequest}
                  onChange={(e) => setCorrectionRequest(e.target.value)}
                  rows={5}
                  className="w-full p-3 bg-slate-100 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="例：「課題・悩み」の部分を、もう少しポジティブな表現に修正してください。"
                  autoFocus
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">現在のサマリー（修正前）</h4>
                <div className="prose prose-sm max-w-none p-3 bg-slate-50 rounded-lg border max-h-48 overflow-y-auto">
                   <div dangerouslySetInnerHTML={createMarkup(parsedSummary.user_summary)} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-4 sm:p-6 rounded-lg border ${activeTab === 'user' ? 'bg-sky-50 border-sky-100' : 'bg-emerald-50 border-emerald-100'}`}>
                {activeTab === 'pro' && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md mb-4 inline-block">
                    ※キャリアコンサルタントとの連携に適した構造化ノートです
                  </p>
                )}
                <article 
                    className={`prose prose-slate max-w-none 
                               ${activeTab === 'user' 
                                 ? 'prose-h2:text-sky-800 prose-h2:border-sky-200 prose-h3:text-sky-700' 
                                 : 'prose-h2:text-emerald-800 prose-h2:border-emerald-200 prose-h3:text-emerald-700'}
                               prose-h2:font-bold prose-h2:border-b-2 prose-h2:pb-2 prose-h2:mb-4 prose-h2:text-xl
                               prose-h3:font-semibold prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-lg
                               prose-ul:list-inside prose-ul:space-y-1
                               prose-li:marker:text-slate-400
                               prose-p:leading-relaxed
                               prose-strong:text-slate-800`}
                    dangerouslySetInnerHTML={createMarkup(currentContent)} 
                />
            </div>
          )}
        </div>

        <footer className="p-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex-shrink-0">
           {isEditing ? (
             <div className="flex gap-4">
               <button
                 onClick={() => setIsEditing(false)}
                 disabled={isLoading}
                 className="w-full px-4 py-3 font-semibold rounded-lg transition-colors duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
               >
                 キャンセル
               </button>
               <button
                 onClick={handleRevisionSubmit}
                 disabled={!correctionRequest.trim() || isLoading}
                 className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
               >
                 修正を反映する
               </button>
             </div>
           ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600">内容を確認し、問題なければ「確定」ボタンで相談を完了してください。</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-colors duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  <EditIcon />
                  修正依頼
                </button>
                <button 
                  onClick={handleCopy} 
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all duration-200 ${
                    isCopied
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                  {isCopied ? 'コピー済' : 'コピー'}
                </button>
              </div>
              <button
                onClick={onFinalize}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-lg rounded-lg transition-colors duration-200 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <SaveIcon />
                確定して相談を完了する
              </button>
            </div>
           )}
        </footer>
      </div>
    </div>
  );
};

export default SummaryModal;
