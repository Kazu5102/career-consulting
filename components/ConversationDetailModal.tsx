
// components/ConversationDetailModal.tsx - v6.20 - 2026-05-29 - キャリア・リフレクション・レポートの可視化プロンプト（案1（プレーンMarkdown移行方式））の完全適用に伴うアップデート
import React from 'react';
import { marked } from 'marked';
import { StoredConversation } from '../types';
import MessageBubble from './MessageBubble';

interface ConversationDetailModalProps {
  conversation: StoredConversation;
  onClose: () => void;
  showHandoverNote?: boolean;
}

const ConversationDetailModal: React.FC<ConversationDetailModalProps> = ({ 
  conversation, 
  onClose,
  showHandoverNote = false
}) => {
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
      if (!rawSummary) return { user_summary: '', pro_notes: null };
      const parsed = JSON.parse(rawSummary);
      
      // 構造化レポート (StructuredSummary: title, core_insight, or professional_summary がある場合)
      if (parsed.title || parsed.core_insight || parsed.analysis_points || parsed.next_inquiry || parsed.professional_summary) {
        let convertedUserMarkdown = '';
        
        if (parsed.title) {
          convertedUserMarkdown += `### 🌟 ${parsed.title}\n\n`;
        }
        if (parsed.core_insight) {
          convertedUserMarkdown += `${parsed.core_insight}\n\n`;
        }
        if (parsed.analysis_points && parsed.analysis_points.length > 0) {
          convertedUserMarkdown += `#### 📋 分析ポイント\n\n`;
          parsed.analysis_points.forEach((point: { category: string; observation: string }) => {
            convertedUserMarkdown += `##### ${point.category}\n${point.observation}\n\n`;
          });
        }
        if (parsed.next_inquiry) {
          convertedUserMarkdown += `#### 💬 次への問いかけ\n\n「${parsed.next_inquiry}」\n\n`;
        }

        // 専門家向け詳細ノート (professional_summary を pro_notes に割り当て)
        let proNotesMarkdown = '';
        if (parsed.professional_summary) {
          proNotesMarkdown = parsed.professional_summary;
        } else if (parsed.pro_notes) {
          proNotesMarkdown = parsed.pro_notes;
        } else {
          proNotesMarkdown = '※詳細ノートは生成されていません。';
        }

        return {
          user_summary: convertedUserMarkdown || parsed.user_summary || rawSummary,
          pro_notes: proNotesMarkdown
        };
      }
      
      // 従来の user_summary & pro_notes の判定
      if (parsed.user_summary || parsed.pro_notes) {
        return {
          user_summary: parsed.user_summary || rawSummary,
          pro_notes: parsed.pro_notes || null
        };
      }
      
      return { user_summary: rawSummary, pro_notes: null };
    } catch (e) {
      return { user_summary: rawSummary, pro_notes: null };
    }
  };
  
  const status = conversation.status || 'completed';
  const { user_summary, pro_notes } = parseSummary(conversation.summary);

  // Check for signs of an accidentally imported encrypted file
  const isEncryptedReportArtifact = 
    user_summary.includes("レポート閲覧認証") || 
    user_summary.includes("パスワードを入力してください") ||
    user_summary.includes("高度に暗号化されています") ||
    user_summary.includes("Unlock Report");

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[200] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">セッション記録・引継ぎ資料</h2>
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
          {isEncryptedReportArtifact ? (
             <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center gap-3 text-red-700 font-bold mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <h3>データの誤インポートが検出されました</h3>
                </div>
                <p className="text-sm text-red-600 leading-relaxed">
                    このデータは、本システムが出力した「暗号化されたレポートファイル（HTMLソース）」が誤ってテキストとしてインポートされた可能性があります。<br/>
                    内容は暗号化されているため閲覧できません。不要であれば、管理者画面から削除してください。
                </p>
             </div>
          ) : (
            <div className={`grid grid-cols-1 ${showHandoverNote ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto w-full'} gap-8`}>
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

                {showHandoverNote && (
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
                )}
            </div>
          )}

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
