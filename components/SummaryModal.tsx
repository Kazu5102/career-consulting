
// components/SummaryModal.tsx - v6.22 - 2026-05-29 - キャリア・リフレクション・レポートの可視化プロンプト（案A-1（人間中心構造化JSON方式））の完全適用に伴うアップデート
import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import SaveIcon from './icons/SaveIcon';
import LinkIcon from './icons/LinkIcon';
import ExportIcon from './icons/ExportIcon';
import LockIcon from './icons/LockIcon';
import { StructuredSummary, SurveyConfig, ChatMessage } from '../types';
import { generateSecureHtmlPackage } from '../utils/exportPackage';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string;
  isLoading: boolean;
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
  onFinalize,
  messages,
  userId,
  aiName
}) => {
  // activeTab state removed to hide pro notes
  const [messageIndex, setMessageIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<ModalStep>('loading');
  const [isExported, setIsExported] = useState(false);
  const [exportStep, setExportStep] = useState<'none' | 'password' | 'generating'>('none');
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (exportStep !== 'password') {
      setConfirmPassword('');
      setShowPassword(false);
    }
  }, [exportStep]);

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
      setIsExported(false);
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
  
  // Flatten content for copy/export
  const currentContent = useMemo(() => {
    if (parsedSummary.core_insight) {
      const points = parsedSummary.analysis_points && parsedSummary.analysis_points.length > 0
        ? '\n\n' + parsedSummary.analysis_points.map(p => `### ${p.category}\n${p.observation}`).join('\n\n')
        : '';
      return `# ${parsedSummary.title || '振り返り'}\n\n${parsedSummary.core_insight}${points}\n\n### 次への問いかけ\n${parsedSummary.next_inquiry}`;
    }
    return parsedSummary.user_summary || '';
  }, [parsedSummary]);

  const handleSurveyComplete = () => {
    setCurrentStep('loading');
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
            {currentStep === 'survey' ? 'アンケートのお願い' : currentStep === 'referral' ? '専門家への引継ぎ' : 'キャリア・リフレクション・レポート'}
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
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="パスワードを入力（4文字以上）..." 
                                    value={exportPassword}
                                    onChange={(e) => setExportPassword(e.target.value)}
                                    className="w-full p-4 pr-12 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-500/20 text-center font-bold"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                    title={showPassword ? "パスワードを非表示" : "パスワードを表示"}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>

                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="パスワードを再入力（確認）..." 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-4 pr-12 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-sky-500/20 text-center font-bold"
                                />
                            </div>

                            {exportPassword.length > 0 && exportPassword.length < 4 && (
                                <p className="text-xs text-rose-500 font-bold text-center animate-in fade-in">
                                    パスワードは4文字以上で入力してください。
                                </p>
                            )}

                            {exportPassword.length >= 4 && confirmPassword.length > 0 && exportPassword !== confirmPassword && (
                                <p className="text-xs text-rose-500 font-bold text-center animate-in fade-in">
                                    パスワードが一致しません。
                                </p>
                            )}

                            {exportError && <p className="text-xs text-rose-500 font-bold text-center animate-in fade-in">{exportError}</p>}
                            <button 
                                onClick={handleReferralAndExport}
                                disabled={!exportPassword || exportPassword.length < 4 || exportPassword !== confirmPassword}
                                className="w-full py-4 bg-sky-600 text-white font-black rounded-2xl shadow-lg hover:bg-sky-700 disabled:bg-slate-300 transition-all active:scale-[0.98] disabled:scale-100"
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
                     <div 
                        className="prose max-w-none prose-slate prose-p:leading-relaxed prose-p:text-slate-700 font-medium"
                        dangerouslySetInnerHTML={createMarkup(parsedSummary.core_insight || '')} 
                      />
                   </section>

                   {/* Analysis Points Grid */}
                   <div className="grid grid-cols-1 gap-4">
                     {parsedSummary.analysis_points && parsedSummary.analysis_points.length > 0 && parsedSummary.analysis_points.map((point, idx) => (
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
           ) : currentStep === 'result' ? (
            <div className="flex flex-col gap-5">
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
