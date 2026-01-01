
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import EditIcon from './icons/EditIcon';
import SaveIcon from './icons/SaveIcon';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
  onRevise: (correctionRequest: string) => void;
  onFinalize: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary, isLoading, onRevise, onFinalize }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [correctionRequest, setCorrectionRequest] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setIsCopied(false);
      setIsEditing(false);
      setCorrectionRequest('');
    }
  }, [isOpen]);
  
  const handleCopy = () => {
    if (summary && !isLoading) {
      navigator.clipboard.writeText(summary).then(() => {
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'サマリーの修正依頼' : '相談内容のサマリー'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
               <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-semibold">{isEditing ? 'AIがサマリーを修正しています...' : 'AIが対話内容を要約しています...'}</p>
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
                   <div dangerouslySetInnerHTML={createMarkup(summary)} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-sky-50 p-4 sm:p-6 rounded-lg border border-sky-100">
                <article 
                    className="prose prose-slate max-w-none 
                               prose-h2:font-bold prose-h2:text-sky-800 prose-h2:border-b-2 prose-h2:border-sky-200 prose-h2:pb-2 prose-h2:mb-4 prose-h2:text-xl
                               prose-h3:font-semibold prose-h3:text-sky-700 prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-lg
                               prose-ul:list-inside prose-ul:space-y-1
                               prose-li:marker:text-sky-500
                               prose-p:leading-relaxed
                               prose-strong:text-slate-800"
                    dangerouslySetInnerHTML={createMarkup(summary)} 
                />
            </div>
          )}
        </div>

        <footer className="p-5 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
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
              <p className="text-sm text-slate-600">内容を確認し、必要であれば修正を依頼できます。問題なければ「確定」ボタンで相談を完了してください。</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-colors duration-200 bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <EditIcon />
                  修正を依頼
                </button>
                <button 
                  onClick={handleCopy} 
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all duration-200 ${
                    isCopied
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  } disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed`}
                >
                  {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                  {isCopied ? 'コピー完了' : 'コピー'}
                </button>
              </div>
              <button
                onClick={onFinalize}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-lg rounded-lg transition-colors duration-200 bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
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
