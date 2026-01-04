
import React from 'react';
import { marked } from 'marked';
import { StoredConversation } from '../types';
import MessageBubble from './MessageBubble';

interface ConversationDetailModalProps {
  conversation: StoredConversation;
  onClose: () => void;
}

const ConversationDetailModal: React.FC<ConversationDetailModalProps> = ({ conversation, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', { dateStyle: 'long', timeStyle: 'short' });
  };
  
  const createMarkup = (markdownText: string) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
  };

  const parseSummary = (rawSummary: string) => {
    try {
      const parsed = JSON.parse(rawSummary);
      if (parsed.user_summary && parsed.pro_notes) return parsed;
      return { user_summary: rawSummary, pro_notes: null };
    } catch (e) {
      return { user_summary: rawSummary, pro_notes: null };
    }
  };
  
  const status = conversation.status || 'completed';
  const { user_summary, pro_notes } = parseSummary(conversation.summary);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">セッション記録・引継ぎ書</h2>
               <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                    {status}
                </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-tighter">{formatDate(conversation.date)} • AI Agent: {conversation.aiName}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-amber-50/40 p-6 rounded-3xl border border-amber-100/50">
              <div className="flex items-center gap-2 mb-6 text-amber-800">
                <span className="text-xs font-black uppercase tracking-widest px-2 py-1 bg-amber-100 rounded">User Facing</span>
                <h3 className="text-lg font-bold">相談の振り返り</h3>
              </div>
              <article 
                  className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={createMarkup(user_summary)}
              />
            </section>

            <section className="bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100/50">
              <div className="flex items-center gap-2 mb-6 text-emerald-800">
                <span className="text-xs font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 rounded">Handover Note</span>
                <h3 className="text-lg font-bold">専門家向け詳細ノート</h3>
              </div>
              {pro_notes ? (
                <article 
                    className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={createMarkup(pro_notes)}
                />
              ) : (
                <p className="text-slate-400 italic text-sm">※詳細ノートは生成されていません。</p>
              )}
            </section>
          </div>

          <section>
            <div className="flex items-center gap-3 mb-6 px-1">
                <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-800">全対話ログ</h3>
            </div>
            <div className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
              {conversation.messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}
              {conversation.messages.length === 0 && (
                  <p className="text-center text-slate-400 text-xs italic py-4">※インポートされた要約のみの履歴です。</p>
              )}
            </div>
          </section>
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 text-right">
           <button 
            onClick={onClose} 
            className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95"
          >
            閉じる
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConversationDetailModal;
