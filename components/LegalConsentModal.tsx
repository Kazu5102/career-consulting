
import React, { useState } from 'react';
import { AI_TERMS_OF_USE, PRIVACY_POLICY, AI_ETHICS_GUIDELINE } from '../data/legalTexts';
import { marked } from 'marked';

interface LegalConsentModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const LegalConsentModal: React.FC<LegalConsentModalProps> = ({ isOpen, onConfirm }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'ethics'>('terms');
  const [isChecked, setIsChecked] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const renderContent = () => {
    const text = activeTab === 'terms' ? AI_TERMS_OF_USE : activeTab === 'privacy' ? PRIVACY_POLICY : AI_ETHICS_GUIDELINE;
    return <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(text) }} />;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[300] flex justify-center items-center p-4 backdrop-blur-xl">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300 border border-white/20">
        <header className="p-8 border-b border-slate-100 text-center bg-white relative">
          <div className="flex justify-center mb-3">
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-full shadow-lg normal-case tracking-wide">
              Protocol 2.0 Verified
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">サービス利用前の合意形成</h2>
          <p className="text-sm text-slate-500 mt-2 font-bold uppercase tracking-tight">Legal & Ethical Compliance Checklist</p>
        </header>

        <nav className="flex bg-slate-50 border-b border-slate-100 p-1">
          {[
            { id: 'terms', label: '利用規約' },
            { id: 'privacy', label: '個人情報保護' },
            { id: 'ethics', label: 'AI倫理指針' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${
                activeTab === tab.id ? 'bg-white text-sky-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div 
          className="flex-1 overflow-y-auto p-8 sm:p-10 bg-slate-50/20"
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop <= clientHeight + 10) setHasScrolledToBottom(true);
          }}
        >
          {renderContent()}
          {!hasScrolledToBottom && (
            <div className="mt-8 p-4 bg-amber-50 text-amber-700 text-[10px] font-bold text-center rounded-lg border border-amber-100 animate-pulse">
              最後までスクロールして内容を確認してください
            </div>
          )}
        </div>

        <footer className="p-8 bg-white border-t border-slate-100 space-y-6">
          <div className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500 ${
            isChecked ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center h-5 mt-1">
              <input 
                type="checkbox" 
                id="consent-check" 
                disabled={!hasScrolledToBottom}
                className="w-6 h-6 rounded-lg border-slate-300 text-sky-600 focus:ring-sky-500 transition-all cursor-pointer disabled:cursor-not-allowed" 
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
            </div>
            <label htmlFor="consent-check" className={`text-sm font-bold leading-relaxed cursor-pointer ${
              hasScrolledToBottom ? 'text-slate-900' : 'text-slate-400'
            }`}>
              私は上記の利用規約、個人情報保護方針、およびAI倫理指針のすべての項目を確認し、これに同意した上でサービスを利用します。
            </label>
          </div>
          
          <button
            onClick={onConfirm}
            disabled={!isChecked}
            className="w-full py-5 bg-slate-900 text-white font-black text-xl rounded-2xl shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none uppercase tracking-widest"
          >
            同意して相談を開始する
          </button>
        </footer>
      </div>
    </div>
  );
};

export default LegalConsentModal;
