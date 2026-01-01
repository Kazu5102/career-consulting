
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
  
  const status = conversation.status || 'completed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">相談履歴の詳細</h2>
               <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                    status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                    {status === 'completed' ? '完了' : '中断'}
                </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">{formatDate(conversation.date)} (担当AI: {conversation.aiName})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">相談サマリー</h3>
              <div className="bg-sky-50 p-4 sm:p-6 rounded-lg border border-sky-100 mt-4">
                  <article 
                      className="prose prose-slate max-w-none 
                                 prose-h2:font-bold prose-h2:text-sky-800 prose-h2:border-b-2 prose-h2:border-sky-200 prose-h2:pb-2 prose-h2:mb-4 prose-h2:text-xl
                                 prose-h3:font-semibold prose-h3:text-sky-700 prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-lg
                                 prose-ul:list-inside prose-ul:space-y-1
                                 prose-li:marker:text-sky-500
                                 prose-p:leading-relaxed
                                 prose-strong:text-slate-800"
                      dangerouslySetInnerHTML={createMarkup(conversation.summary)}
                  />
              </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">対話履歴</h3>
            <div className="space-y-4">
              {conversation.messages.map((msg, index) => (
                <MessageBubble key={index} message={msg} />
              ))}
            </div>
          </div>
        </div>

        <footer className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl text-right">
           <button 
            onClick={onClose} 
            className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            閉じる
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConversationDetailModal;
