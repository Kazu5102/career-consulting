
// components/SummaryModal.tsx - v4.33 - Enhanced UX & Reassurance
import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import EditIcon from './icons/EditIcon';
import SaveIcon from './icons/SaveIcon';
import LinkIcon from './icons/LinkIcon';
import ExportIcon from './icons/ExportIcon';
import { StructuredSummary, SurveyConfig, ChatMessage } from '../types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
  onRevise: (correctionRequest: string) => void;
  onFinalize: () => void;
  // Added for Handover Export
  messages: ChatMessage[];
  userId: string;
  aiName: string;
}

const REASSURANCE_MESSAGES = [
  "今日のお話を、客観的な事実として整理しています...",
  "あなたの感情の揺れを丁寧に言葉にしています...",
  "絡まった糸をほどくように、文脈を整理しています...",
  "専門家（キャリコン）へ繋ぐための情報をまとめています...",
  "言葉にならない想いも、大切に拾い上げています...",
  "この対話が、あなたの一歩に変わりますように...",
  "アドバイスではなく、あなたの「ありのまま」を抽出中です...",
  "あなたのペースで歩んだ軌跡を、地図に描いています...",
  "沈黙の中にあった意味も、しっかりと受け止めています...",
  "小さな気づきの種が、芽吹く準備をしています...",
  "この時間が、未来への確かな手応えになりますように...",
  "まもなく、対話の振り返りシートが完成します..."
];

const SURVEY_CONFIG: SurveyConfig = {
  isEnabled: false,
  url: "https://www.google.com/search?q=career+consulting+survey",
  title: "より良いサービス向上のためのアンケート",
  description: "対話の要約を作成している間に、簡単なアンケートへのご協力をお願いします。回答完了後、要約結果が表示されます。"
};

type ModalStep = 'survey' | 'loading' | 'result' | 'referral';

const SummaryModal: React.FC<SummaryModalProps> = ({ 
  isOpen, 
  onClose, 
  summary, 
  isLoading, 
  onRevise, 
  onFinalize,
  messages,
  userId,
  aiName
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [correctionRequest, setCorrectionRequest] = useState('');
  // activeTab state removed to hide pro notes
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<ModalStep>('loading');

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
    if (isOpen) {
      setIsCopied(false);
      setIsEditing(false);
      setCorrectionRequest('');
      const surveyEnabled = localStorage.getItem('survey_enabled_v1') === 'true';
      setCurrentStep(surveyEnabled ? 'survey' : 'loading');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLoading && currentStep === 'loading' && summary) {
      setCurrentStep('result');
    }
  }, [isLoading, currentStep, summary]);

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
  
  // Always show user_summary
  const currentContent = parsedSummary.user_summary;

  const handleCopy = () => {
    if (currentContent && !isLoading) {
      navigator.clipboard.writeText(currentContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
    }
  };

  const handleSurveyComplete = () => {
    setCurrentStep('loading');
  };

  const handleRevisionSubmit = async () => {
    if (!correctionRequest.trim() || isLoading) return;
    setCurrentStep('loading');
    await onRevise(correctionRequest);
    setIsEditing(false);
    setCorrectionRequest('');
  };
  
  const handleProceedToReferral = () => {
      setCurrentStep('referral');
  };

  const handleReferralAndExport = () => {
    // 0. Copy to Clipboard (Auto) - User Summary is best for forms
    const textToCopy = parsedSummary.user_summary || summary;
    navigator.clipboard.writeText(textToCopy).then(() => {
        console.debug('Summary copied to clipboard automatically.');
    }).catch(e => console.warn('Auto-copy failed', e));

    // 1. Create Export Data
    const exportData = {
        meta: {
            title: "Career-Action 引継ぎ用データ",
            description: "一般社団法人Career-Action所属コンサルタントへの提供用ファイル",
            generatedAt: new Date().toISOString(),
            userId,
            aiAgent: aiName
        },
        summary: parsedSummary,
        chatHistory: messages
    };
    
    // 2. Trigger Download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `career_action_handoff_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 3. Confirm and Redirect (Dummy URL)
    setTimeout(() => {
        const confirmMsg = "【データ保存とコピー完了】\n\n1. 引継ぎ用ファイルを保存しました。\n2. 相談の要約テキストをクリップボードにコピーしました。\n\n一般社団法人Career-Actionの申し込みサイトへ移動しますか？\n（移動先のフォームで「貼り付け」て使用できます）";
        if (window.confirm(confirmMsg)) {
            window.open("https://example.com/career-action-dummy", "_blank");
        }
    }, 800);
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
          <h2 className="text-xl font-bold text-slate-800">
            {currentStep === 'survey' ? 'アンケートのお願い' : isEditing ? '整理内容の修正依頼' : currentStep === 'referral' ? '専門家への引継ぎ' : '対話の振り返り'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        {/* Tab Selection Removed */}

        <div className="p-6 flex-1 overflow-y-auto">
          {currentStep === 'survey' ? (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-10 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                    <ClipboardIcon />
                </div>
                <div className="text-center space-y-4 max-w-md">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{SURVEY_CONFIG.title}</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">
                        {SURVEY_CONFIG.description}
                    </p>
                </div>
                <div className="w-full max-w-sm space-y-4">
                    <a 
                      href={SURVEY_CONFIG.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-emerald-500 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-sm"
                    >
                        <LinkIcon className="w-5 h-5" />
                        アンケート回答フォームを開く
                    </a>
                    <button 
                      onClick={handleSurveyComplete}
                      className="w-full py-4 bg-emerald-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all"
                    >
                        回答しました（要約結果を表示）
                    </button>
                </div>
            </div>
          ) : currentStep === 'loading' || isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-16">
               <div className="relative mb-10">
                 <div className="w-20 h-20 border-4 border-sky-100 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-20 h-20 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
               {/* Updated Layout: Centered container, Left-aligned text for multi-line support */}
              <div className="w-full flex justify-center px-4">
                 <p className="inline-block text-left font-bold text-xl text-slate-800 min-h-[3rem] animate-in fade-in slide-in-from-bottom-2 duration-1000 leading-relaxed" key={messageIndex}>
                    {REASSURANCE_MESSAGES[messageIndex]}
                 </p>
              </div>
            </div>
          ) : currentStep === 'referral' ? (
             <div className="flex flex-col items-center justify-center h-full space-y-8 py-6 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-2 shadow-xl shadow-sky-100/50 border-4 border-sky-100">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div className="text-center space-y-4 max-w-md px-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">専門家への相談を推奨します</h3>
                    <p className="text-slate-600 leading-relaxed font-medium text-sm">
                        AIとの対話データを引き継ぐことで、よりスムーズな支援が受けられます。<br/>
                        <strong className="text-sky-700">一般社団法人Career-Action</strong>に所属する<br/>
                        キャリアコンサルタントへデータを渡して相談しましょう。
                    </p>
                </div>
                <div className="w-full max-w-sm space-y-3">
                    <button 
                      onClick={handleReferralAndExport}
                      className="flex items-center justify-center gap-3 w-full py-4 bg-sky-600 text-white font-bold rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 active:scale-95 group"
                    >
                        <ExportIcon className="w-5 h-5" />
                        データを保存して相談を申し込む
                    </button>
                    
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white px-2 text-xs font-bold text-slate-400">または</span>
                        </div>
                    </div>
                    
                    <button 
                      onClick={onFinalize}
                      className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 font-bold text-lg rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <SaveIcon className="w-5 h-5" />
                        相談せず、保存してトップに戻る
                    </button>
                </div>
            </div>
          ) : isEditing ? (
             <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <label htmlFor="correction-request" className="block text-sm font-bold text-slate-700 mb-2">修正・追記したい内容を入力してください</label>
                <textarea
                  id="correction-request"
                  value={correctionRequest}
                  onChange={(e) => setCorrectionRequest(e.target.value)}
                  rows={5}
                  className="w-full p-4 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  placeholder="例：今の仕事へのやりがいの部分をもう少し詳しく書きたいです。"
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <>
              <div className={`p-6 sm:p-10 rounded-2xl border transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 bg-amber-50/40 border-amber-100 shadow-inner`}>
                  <article 
                      className={`prose max-w-none prose-slate prose-h2:text-amber-900 prose-h2:border-amber-200 prose-h2:text-2xl prose-h3:text-amber-800
                                 prose-h2:font-bold prose-h2:border-b-2 prose-h2:pb-3 prose-h2:mb-8
                                 prose-p:leading-relaxed prose-p:text-slate-700`}
                      dangerouslySetInnerHTML={createMarkup(currentContent)} 
                  />
              </div>
            </>
          )}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-200 z-10">
           {currentStep === 'survey' ? (
             <button onClick={onClose} className="w-full px-4 py-3 font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">キャンセルして戻る</button>
           ) : isEditing ? (
             <div className="flex gap-4">
               <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-3 font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">キャンセル</button>
               <button onClick={handleRevisionSubmit} className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-md">修正を反映する</button>
             </div>
           ) : currentStep === 'result' ? (
            <div className="flex flex-col gap-5">
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all"><EditIcon />修正・追記</button>
                <button onClick={handleCopy} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all ${isCopied ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}>{isCopied ? <CheckIcon /> : <ClipboardIcon />}{isCopied ? 'コピー完了' : 'コピー'}</button>
              </div>
              <button onClick={handleProceedToReferral} className="w-full flex items-center justify-center gap-2 px-4 py-4 font-bold text-xl rounded-2xl transition-all duration-300 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-lg">
                <div className="flex items-center gap-2">
                    <span>整理を完了し、専門家に相談する</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
              </button>
            </div>
           ) : currentStep === 'referral' ? (
             <button onClick={() => setCurrentStep('result')} className="w-full px-4 py-3 font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">
                振り返り画面に戻る
             </button>
           ) : null}
        </footer>
      </div>
    </div>
  );
};

export default SummaryModal;
