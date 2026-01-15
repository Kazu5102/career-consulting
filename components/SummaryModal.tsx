
// components/SummaryModal.tsx - v2.41 - Survey Onboarding Logic
import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import EditIcon from './icons/EditIcon';
import SaveIcon from './icons/SaveIcon';
import LinkIcon from './icons/LinkIcon';
import { StructuredSummary, SurveyConfig } from '../types';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
  onRevise: (correctionRequest: string) => void;
  onFinalize: () => void;
}

const REASSURANCE_MESSAGES = [
  "今日のお話を、客観的な事実として整理しています...",
  "あなたの感情の揺れを丁寧に言葉にしています...",
  "専門家（キャリコン）へ繋ぐための情報をまとめています...",
  "この対話が、あなたの一歩に変わりますように...",
  "アドバイスではなく、あなたの「ありのまま」を抽出中です...",
  "まもなく、対話の振り返りシートが完成します..."
];

// 汎用的なアンケート設定（必要に応じて外部から注入可能）
const SURVEY_CONFIG: SurveyConfig = {
  isEnabled: true,
  url: "https://www.google.com/search?q=career+consulting+survey", // ダミーリンク
  title: "より良いサービス向上のためのアンケート",
  description: "対話の要約を作成している間に、簡単なアンケートへのご協力をお願いします。回答完了後、要約結果が表示されます。"
};

type ModalStep = 'survey' | 'loading' | 'result';

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary, isLoading, onRevise, onFinalize }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [correctionRequest, setCorrectionRequest] = useState('');
  const [activeTab, setActiveTab] = useState<'user' | 'pro'>('user');
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<ModalStep>('survey');

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
      // アンケートが有効な場合はsurveyステップから開始
      setCurrentStep(SURVEY_CONFIG.isEnabled ? 'survey' : 'loading');
    }
  }, [isOpen]);

  useEffect(() => {
    // 外部からのisLoadingが終了し、かつ現在のステップがloadingであればresultへ移行
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
  
  const currentContent = activeTab === 'user' ? parsedSummary.user_summary : parsedSummary.pro_notes;

  const handleCopy = () => {
    if (currentContent && !isLoading) {
      navigator.clipboard.writeText(currentContent).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      });
    }
  };

  const handleSurveyComplete = () => {
    // 解析中のステップへ移行（親コンポーネントで既に解析が始まっていない場合はここでトリガーする設計も可能）
    setCurrentStep('loading');
  };

  const handleRevisionSubmit = async () => {
    if (!correctionRequest.trim() || isLoading) return;
    setCurrentStep('loading');
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
          <h2 className="text-xl font-bold text-slate-800">
            {currentStep === 'survey' ? 'アンケートのお願い' : isEditing ? '整理内容の修正依頼' : '対話の振り返り'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        {currentStep === 'result' && !isEditing && (
          <div className="flex bg-slate-100 p-1 mx-6 mt-4 rounded-xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('user')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'user' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              相談の振り返り
            </button>
            <button 
              onClick={() => setActiveTab('pro')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'pro' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              専門家への引継ぎ用
            </button>
          </div>
        )}

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
                    <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
                        Your privacy is our priority
                    </p>
                </div>
            </div>
          ) : currentStep === 'loading' || isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 py-16">
               <div className="relative mb-10">
                 <div className="w-20 h-20 border-4 border-sky-100 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-20 h-20 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
              <p className="font-bold text-xl text-center text-slate-800 min-h-[3rem] px-4 animate-in fade-in slide-in-from-bottom-2 duration-1000" key={messageIndex}>
                {REASSURANCE_MESSAGES[messageIndex]}
              </p>
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
            <div className={`p-6 sm:p-10 rounded-2xl border transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 ${activeTab === 'user' ? 'bg-amber-50/40 border-amber-100 shadow-inner' : 'bg-emerald-50/40 border-emerald-100 shadow-inner'}`}>
                {activeTab === 'pro' && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-md mb-8 inline-block shadow-sm">
                    ※プロのキャリアコンサルタントが分析する際に参照する情報です
                  </p>
                )}
                <article 
                    className={`prose max-w-none 
                               ${activeTab === 'user' 
                                 ? 'prose-slate prose-h2:text-amber-900 prose-h2:border-amber-200 prose-h2:text-2xl prose-h3:text-amber-800' 
                                 : 'prose-slate prose-h2:text-emerald-800 prose-h2:border-emerald-200 prose-h3:text-emerald-700'}
                               prose-h2:font-bold prose-h2:border-b-2 prose-h2:pb-3 prose-h2:mb-8
                               prose-p:leading-relaxed prose-p:text-slate-700`}
                    dangerouslySetInnerHTML={createMarkup(currentContent)} 
                />
            </div>
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
              <button onClick={onFinalize} className="w-full flex items-center justify-center gap-2 px-4 py-4 font-bold text-xl rounded-2xl transition-all duration-300 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-lg">
                <SaveIcon />整理を完了し、専門家に相談する
              </button>
            </div>
           ) : null}
        </footer>
      </div>
    </div>
  );
};

export default SummaryModal;
