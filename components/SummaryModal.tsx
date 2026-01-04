
// components/SummaryModal.tsx - v2.21 - Reassurance UX Enhancement
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
  summary: string;
  isLoading: boolean;
  onRevise: (correctionRequest: string) => void;
  onFinalize: () => void;
}

const REASSURANCE_MESSAGES = [
  "AIがあなたの物語を丁寧に整理しています...",
  "今日の大切な気づきを言葉に紡いでいます...",
  "あなたの価値観の輪郭をなぞっています...",
  "対話の核心から、未来へのヒントを探しています...",
  "自分でも気づかなかった「あなたらしさ」を抽出中です...",
  "まもなく、あなただけの振り返りが完成します..."
];

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary, isLoading, onRevise, onFinalize }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [correctionRequest, setCorrectionRequest] = useState('');
  const [activeTab, setActiveTab] = useState<'user' | 'pro'>('user');
  const [messageIndex, setMessageIndex] = useState(0);

  const parsedSummary = useMemo((): StructuredSummary => {
    try {
      if (!summary) return { user_summary: '', pro_notes: '' };
      const parsed = JSON.parse(summary);
      if (parsed.user_summary && parsed.pro_notes) return parsed;
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

  // Message rotator for reassurance
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    if (isLoading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % REASSURANCE_MESSAGES.length);
      }, 4500);
    } else {
      setMessageIndex(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLoading]);
  
  const currentContent = activeTab === 'user' ? parsedSummary.user_summary : parsedSummary.pro_notes;

  const handleCopy = () => {
    if (currentContent && !isLoading) {
      navigator.clipboard.writeText(currentContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
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
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center p-4 backdrop-blur-md" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{isEditing ? 'サマリーの修正依頼' : '相談内容のサマリー'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        {!isEditing && !isLoading && (
          <div className="flex bg-slate-100 p-1 mx-6 mt-4 rounded-xl border border-slate-200">
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
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-16">
               <div className="relative mb-10">
                 <div className="w-20 h-20 border-4 border-sky-100 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-20 h-20 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-sky-400 rounded-full animate-ping"></div>
                 </div>
               </div>
              <p className="font-bold text-xl text-center text-slate-800 min-h-[3rem] animate-in fade-in slide-in-from-bottom-2 duration-1000" key={messageIndex}>
                {REASSURANCE_MESSAGES[messageIndex]}
              </p>
              <div className="flex gap-1.5 mt-6">
                {REASSURANCE_MESSAGES.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === messageIndex ? 'bg-sky-500 w-4' : 'bg-slate-200'}`}></div>
                ))}
              </div>
              <p className="text-sm text-slate-400 mt-8 font-medium">解析中につき、そのまま少しだけお待ちください</p>
            </div>
          ) : isEditing ? (
             <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label htmlFor="correction-request" className="block text-sm font-bold text-slate-700 mb-2">修正内容を具体的に入力してください</label>
                <textarea
                  id="correction-request"
                  value={correctionRequest}
                  onChange={(e) => setCorrectionRequest(e.target.value)}
                  rows={5}
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  placeholder="例：「課題・悩み」の部分を、もう少しポジティブな表現に修正してください。"
                  autoFocus
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">現在のサマリー（修正前）</h4>
                <div className="prose prose-sm max-w-none p-4 bg-slate-50 rounded-xl border max-h-48 overflow-y-auto italic text-slate-500">
                   <div dangerouslySetInnerHTML={createMarkup(parsedSummary.user_summary)} />
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-6 sm:p-10 rounded-2xl border transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 ${activeTab === 'user' ? 'bg-amber-50/40 border-amber-100 shadow-inner' : 'bg-emerald-50/40 border-emerald-100 shadow-inner'}`}>
                {activeTab === 'pro' && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-md mb-8 inline-block shadow-sm">
                    ※キャリアコンサルタントとの連携に適した構造化ノートです
                  </p>
                )}
                <article 
                    className={`prose max-w-none 
                               ${activeTab === 'user' 
                                 ? 'prose-slate prose-h2:text-amber-900 prose-h2:border-amber-200 prose-h2:text-2xl prose-h3:text-amber-800 prose-li:marker:text-amber-400' 
                                 : 'prose-slate prose-h2:text-emerald-800 prose-h2:border-emerald-200 prose-h3:text-emerald-700 prose-li:marker:text-emerald-400'}
                               prose-h2:font-bold prose-h2:border-b-2 prose-h2:pb-3 prose-h2:mb-8
                               prose-h3:font-bold prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-lg
                               prose-ul:my-6 prose-li:my-2
                               prose-p:leading-relaxed prose-p:my-6 prose-p:text-slate-700
                               prose-strong:text-slate-900 prose-strong:bg-amber-200/50 prose-strong:px-1 prose-strong:rounded`}
                    dangerouslySetInnerHTML={createMarkup(currentContent)} 
                />
                {activeTab === 'user' && (
                   <div className="mt-16 pt-8 border-t border-amber-100 text-center text-amber-800/40 text-sm font-serif italic">
                      あなたの歩みを、いつも応援しています。
                   </div>
                )}
            </div>
          )}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-200 z-10">
           {isEditing ? (
             <div className="flex gap-4">
               <button
                 onClick={() => setIsEditing(false)}
                 disabled={isLoading}
                 className="flex-1 px-4 py-3 font-semibold rounded-xl transition-all duration-200 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
               >
                 キャンセル
               </button>
               <button
                 onClick={handleRevisionSubmit}
                 disabled={!correctionRequest.trim() || isLoading}
                 className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all duration-200 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-400 shadow-md"
               >
                 修正を反映する
               </button>
             </div>
           ) : (
            <div className="flex flex-col gap-5">
              {!isLoading && <p className="text-sm text-slate-500 text-center font-medium">内容を確認し、問題なければ「確定」ボタンで相談を完了してください。</p>}
              <div className="flex gap-4">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all duration-200 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  <EditIcon />
                  修正依頼
                </button>
                <button 
                  onClick={handleCopy} 
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all duration-200 ${
                    isCopied
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50`}
                >
                  {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                  {isCopied ? 'コピー完了' : 'コピー'}
                </button>
              </div>
              <button
                onClick={onFinalize}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 font-bold text-xl rounded-2xl transition-all duration-300 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-lg hover:shadow-emerald-200 disabled:bg-slate-400 disabled:shadow-none"
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
