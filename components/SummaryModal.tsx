
// components/SummaryModal.tsx - v5.90 - 2026-05-17 - Unified Download Utility
import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import EditIcon from './icons/EditIcon';
import SaveIcon from './icons/SaveIcon';
import LinkIcon from './icons/LinkIcon';
import ExportIcon from './icons/ExportIcon';
import LockIcon from './icons/LockIcon';
import { StructuredSummary, SurveyConfig, ChatMessage } from '../types';
import { generateSecureHtmlPackage } from '../utils/exportPackage';

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
  const [isExported, setIsExported] = useState(false);
  const [exportStep, setExportStep] = useState<'none' | 'password' | 'generating'>('none');
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');

  const parsedSummary = useMemo((): StructuredSummary => {
    try {
      if (!summary) return {};
      const parsed = JSON.parse(summary);
      
      // Handle legacy format v5.66
      if (parsed.user_summary && !parsed.core_insight) {
        return parsed;
      }
      
      // Handle rich format v5.70
      if (parsed.core_insight) {
        return parsed;
      }

      // Final fallback
      return { user_summary: summary };
    } catch (e) {
      return { user_summary: summary };
    }
  }, [summary]);

  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
      setIsEditing(false);
      setIsExported(false);
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
  
  // Flatten content for copy
  const currentContent = useMemo(() => {
    if (parsedSummary.core_insight) {
      const points = parsedSummary.analysis_points?.map(p => `### ${p.category}\n${p.observation}`).join('\n\n') || '';
      return `# ${parsedSummary.title || '振り返り'}\n\n${parsedSummary.core_insight}\n\n${points}\n\n### 次への問いかけ\n${parsedSummary.next_inquiry}`;
    }
    return parsedSummary.user_summary || '';
  }, [parsedSummary]);

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

  const handleReferralAndExport = async () => {
    if (!exportPassword) {
        setExportStep('password');
        return;
    }

    setExportStep('generating');
    setExportError('');

    try {
        // 0. Copy to Clipboard (Auto)
        navigator.clipboard.writeText(currentContent).catch(e => console.warn('Auto-copy failed', e));

        // 1. Create Export Data
        const exportData = {
            meta: {
                title: "キャリア相談 引継ぎ用データ",
                generatedAt: new Date().toISOString(),
                userId,
                aiAgent: aiName,
                version: "5.70"
            },
            summary: parsedSummary,
            chatHistory: messages
        };
        
        // 2. Generate Secure HTML Package
        const htmlContent = await generateSecureHtmlPackage(exportData, exportPassword);
        
        // 3. Trigger Download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const { downloadFile, getLocalIsoDateString } = await import('../utils/downloadUtils');
        downloadFile(blob, `career_report_${getLocalIsoDateString()}.html`);

        // 4. Update state to show the link button
        setIsExported(true);
        setExportStep('none');
    } catch (err: any) {
        setExportError("エラーが発生しました: " + err.message);
        setExportStep('password');
    }
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
            {currentStep === 'survey' ? 'アンケートのお願い' : isEditing ? '整理内容の修正依頼' : currentStep === 'referral' ? '専門家への引継ぎ' : 'キャリア・リフレクション・レポート'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
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
                {exportStep === 'password' ? (
                    <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-100">
                                <LockIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">ファイルを保護します</h3>
                            <p className="text-xs text-slate-500 mt-2">
                                データの暗号化に使用するパスワードを設定してください。<br/>
                                <strong>管理者が閲覧する際も、このパスワードが必要です。</strong>
                            </p>
                        </div>
                        <div className="space-y-3">
                            <input 
                                type="password" 
                                placeholder="パスワードを入力..." 
                                value={exportPassword}
                                onChange={(e) => setExportPassword(e.target.value)}
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-500/20 text-center font-bold"
                                autoFocus
                            />
                            {exportError && <p className="text-xs text-rose-500 font-bold text-center">{exportError}</p>}
                            <button 
                                onClick={handleReferralAndExport}
                                disabled={!exportPassword || exportPassword.length < 4}
                                className="w-full py-4 bg-sky-600 text-white font-black rounded-2xl shadow-lg hover:bg-sky-700 disabled:bg-slate-300 transition-all active:scale-95"
                            >
                                暗号化パッケージを作成
                            </button>
                            <button 
                                onClick={() => setExportStep('none')}
                                className="w-full py-2 text-slate-400 text-sm font-bold hover:text-slate-600"
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                ) : exportStep === 'generating' ? (
                    <div className="text-center space-y-6">
                        <div className="relative mb-8 text-sky-500">
                            <div className="w-20 h-20 border-4 border-sky-100 rounded-full mx-auto"></div>
                            <div className="absolute top-0 left-[calc(50%-40px)] w-20 h-20 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="font-bold text-slate-700">暗号化を実施中...</p>
                    </div>
                ) : isExported ? (
                    <div className="text-center space-y-6 w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                            <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold mb-1">
                                <CheckIcon className="w-5 h-5"/>
                                <span>暗号化パッケージを保存しました</span>
                            </div>
                            <p className="text-xs text-emerald-600">
                                相談内容のコピーも完了しています。<br/>
                                フォームに貼り付けて使用できます。
                            </p>
                        </div>
                        
                        <a 
                            href="https://www.c-ai.org" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 w-full py-4 bg-sky-600 text-white font-bold rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 active:scale-95 group"
                        >
                            <LinkIcon className="w-5 h-5 text-sky-200" />
                            提携サイト(C-Ai)を開く
                        </a>
                        
                        <div className="pt-2">
                            <button 
                                onClick={onFinalize}
                                className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-sm"
                            >
                                完了してトップに戻る
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center space-y-4 max-w-md px-2">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">専門家への相談を推奨します</h3>
                            <p className="text-slate-600 leading-relaxed font-medium text-sm">
                                AIとの対話データを引き継ぐことで、よりスムーズな支援が受けられます。<br/>
                                <strong className="text-sky-700">支援の専門家</strong>へデータを渡して相談しましょう。
                            </p>
                        </div>
                        <div className="w-full max-w-sm space-y-3">
                            <button 
                            onClick={handleReferralAndExport}
                            className="flex items-center justify-center gap-3 w-full py-4 bg-sky-600 text-white font-bold rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-100 active:scale-95 group"
                            >
                                <ExportIcon className="w-5 h-5" />
                                データを暗号化して相談を申し込む
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
                    </>
                )}
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
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               {parsedSummary.core_insight ? (
                 <div className="space-y-8">
                   {/* Title Section */}
                   <div className="text-center py-6 border-b-2 border-sky-100 mb-8">
                     <span className="text-[10px] font-black tracking-widest text-sky-500 uppercase">Career Reflection Report</span>
                     <h1 className="text-3xl font-black text-slate-800 mt-2">{parsedSummary.title}</h1>
                   </div>

                   {/* Core Insight */}
                   <section className="bg-sky-50/50 p-6 rounded-3xl border border-sky-100 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H8.01703V12H12.017C13.1216 12 14.017 11.1046 14.017 10V5C14.017 3.89543 13.1216 3 12.017 3H5.01703C3.91246 3 3.01703 3.89543 3.01703 5V19C3.01703 20.1046 3.91246 21 5.01703 21H14.017Z"/></svg>
                     </div>
                     <h3 className="text-lg font-black text-sky-800 mb-4 flex items-center gap-2">
                       <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
                       対話の核心
                     </h3>
                     <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{parsedSummary.core_insight}</p>
                   </section>

                   {/* Analysis Points Grid */}
                   <div className="grid grid-cols-1 gap-4">
                     {parsedSummary.analysis_points?.map((point, idx) => (
                       <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-sky-300 transition-all group">
                         <h4 className="text-xs font-black text-slate-400 group-hover:text-sky-500 transition-colors uppercase tracking-widest mb-2">{point.category}</h4>
                         <p className="text-slate-800 font-bold leading-relaxed">{point.observation}</p>
                       </div>
                     ))}
                   </div>

                   {/* Next Inquiry */}
                   <section className="p-8 bg-slate-900 text-white rounded-3xl shadow-xl relative overflow-hidden group">
                     <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>
                     <h3 className="text-sm font-black text-slate-400 mb-4 tracking-[0.2em]">SELF-REFLECTION</h3>
                     <p className="text-xl font-bold leading-relaxed italic">「{parsedSummary.next_inquiry}」</p>
                     <p className="text-xs text-slate-500 mt-6 flex items-center gap-2">
                       <span className="w-4 h-px bg-slate-700"></span>
                       この問いについて、またお時間のある時に考えてみてください
                     </p>
                   </section>
                 </div>
               ) : (
                 <div className="bg-amber-50/40 p-10 rounded-3xl border border-amber-100 shadow-inner">
                   <article 
                       className="prose max-w-none prose-slate prose-p:leading-relaxed prose-p:text-slate-700"
                       dangerouslySetInnerHTML={createMarkup(parsedSummary.user_summary || '')} 
                   />
                 </div>
               )}
            </div>
          )}
        </div>

        <footer className="p-6 bg-white border-t border-slate-100 z-10">
           {currentStep === 'survey' ? (
             <button onClick={onClose} className="w-full px-4 py-3 font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">キャンセルして戻る</button>
           ) : isEditing ? (
             <div className="flex gap-4">
               <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-3 font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">キャンセル</button>
               <button onClick={handleRevisionSubmit} className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-all shadow-md">修正を反映する</button>
             </div>
           ) : currentStep === 'result' ? (
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"><EditIcon />修正・追記</button>
                <button onClick={handleCopy} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all ${isCopied ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{isCopied ? <CheckIcon /> : <ClipboardIcon />}{isCopied ? 'コピー完了' : 'コピー'}</button>
              </div>
              <button onClick={handleProceedToReferral} className="w-full flex items-center justify-center gap-3 px-4 py-5 font-black text-xl rounded-2xl transition-all duration-300 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] shadow-lg shadow-emerald-100 group">
                  <span>レポートを確定して次へ</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
           ) : currentStep === 'referral' ? (
             <button onClick={() => setCurrentStep('result')} className="w-full px-4 py-3 font-semibold rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all">
                レポート画面に戻る
             </button>
           ) : null}
        </footer>
      </div>
    </div>
  );
};

export default SummaryModal;
