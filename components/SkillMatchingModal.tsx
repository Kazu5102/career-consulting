
// components/SkillMatchingModal.tsx - v6.46 - 2026-06-19 - 標準職種タクソノミー（マスターデータ）補完とハローワーク・job-tag連携の親和的実アプローチUI実装
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { SkillMatchingResult, AnalysisStateItem } from '../types';
import { getJobByCode } from '../data/jobTaxonomy';
import BriefcaseIcon from './icons/BriefcaseIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import LinkIcon from './icons/LinkIcon';
import TargetIcon from './icons/TargetIcon';

interface SkillMatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisState: AnalysisStateItem<SkillMatchingResult>;
}

const ANALYSIS_MESSAGES = [
  "AIがあなたのキャリアパスを多角的に分析しています...",
  "これまでの対話から、あなたの強みの結晶を抽出しています...",
  "労働市場のデータと照らし合わせ、最適な可能性を検討中です...",
  "あなたの特性が最も輝く未来の職種をシミュレートしています...",
  "成長を加速させるための最適な学習リソースを厳選しています...",
  "まもなく、あなただけのパーソナライズ・レポートが完成します..."
];

const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
};

const SkillMatchingModal: React.FC<SkillMatchingModalProps> = ({ isOpen, onClose, analysisState }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [expandedRoleCode, setExpandedRoleCode] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | null = null;
    if (analysisState.status === 'loading') {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % ANALYSIS_MESSAGES.length);
      }, 5000);
    } else {
      setMessageIndex(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [analysisState.status]);

  if (!isOpen) return null;
  
  const { status, data: result, error } = analysisState;

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-600 p-10 text-center min-h-[400px] animate-in fade-in duration-500">
          <div className="relative mb-12 scale-110">
            <div className="w-24 h-24 border-4 border-sky-50 rounded-full"></div>
            <div className="absolute top-0 left-0 w-24 h-24 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-sky-500 rounded-full animate-ping"></div>
            </div>
          </div>
          {/* Updated Layout: Centered container, Left-aligned text for multi-line support */}
          <div className="w-full flex justify-center px-4">
            <p className="inline-block text-left text-2xl font-bold text-slate-800 min-h-[4rem] animate-in fade-in slide-in-from-bottom-3 duration-1000 leading-relaxed" key={messageIndex}>
              {ANALYSIS_MESSAGES[messageIndex]}
            </p>
          </div>
          <div className="flex gap-2 mt-8">
            {ANALYSIS_MESSAGES.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-700 ${i === messageIndex ? 'bg-sky-500 w-8' : 'bg-slate-100 w-3'}`}></div>
            ))}
          </div>
          <p className="text-sm text-slate-400 mt-10 font-medium">精密な分析を行っています。このまま1分ほどお待ちください。</p>
        </div>
      );
    }

    if (status === 'error' && error) {
       return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-600 bg-red-50 p-10 rounded-2xl border border-red-100 animate-in shake duration-500">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="font-bold text-xl">分析に失敗しました</h3>
            <p className="mt-3 text-sm font-medium">{error}</p>
        </div>
      );
    }
    
    if (status === 'success' && result) {
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 p-2">
            {/* Analysis Summary */}
            <section>
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-sky-500 rounded-full"></div>
                あなたのキャリアプロファイル
              </h3>
              <article className="prose prose-slate max-w-none prose-p:text-slate-700 prose-p:leading-loose" dangerouslySetInnerHTML={createMarkup(result?.analysisSummary)} />
            </section>

            {/* Recommended Roles */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-sky-100 text-sky-600 p-2.5 rounded-xl shadow-sm"><BriefcaseIcon /></div>
                <h3 className="text-xl font-bold text-slate-800">おすすめの具体職種・初期ステップ</h3>
              </div>
              <div className="grid grid-cols-1 gap-5">
                {result.recommendedRoles?.map(role => {
                    const masterJob = role.job_code ? getJobByCode(role.job_code) : undefined;
                    const isExpanded = expandedRoleCode === (role.job_code || role.role);
                    
                    // job-tag / hello-work の検索リンク
                    const jobTagUrl = `https://shigoto.mhlw.go.jp/User/Search?keyword=${encodeURIComponent(role.role)}`;
                    const helloWorkUrl = `https://www.hellowork.mhlw.go.jp/kensaku/GECA110010.do?searchBtn=%E6%A4%9C%E7%B4%A2&job_keyword=${encodeURIComponent(role.role)}`;

                    return (
                        <div 
                          key={role.role} 
                          className={`bg-white border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all ${
                            isExpanded ? 'border-sky-400 ring-2 ring-sky-50 shadow-md' : 'border-slate-200 hover:border-sky-300'
                          }`}
                        >
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="space-y-1">
                                    {masterJob && (
                                        <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                                            {masterJob.category}
                                        </span>
                                    )}
                                    <h4 className="font-extrabold text-lg text-slate-800">{role.role}</h4>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">適合度</p>
                                    <p className="font-black text-2.5xl text-sky-600 leading-tight">{role.matchScore}%</p>
                                </div>
                            </div>
                            
                            <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner mb-4">
                                <div className="bg-sky-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${role.matchScore}%` }}></div>
                            </div>
                            
                            <p className="text-sm text-slate-600 leading-relaxed font-bold bg-slate-50/70 p-4 rounded-xl border border-slate-100">{role.reason}</p>
                            
                            {/* Master Integration Expand Area */}
                            <div className="mt-4 pt-4 border-t border-dashed border-slate-100 flex flex-col gap-3">
                                <button 
                                  onClick={() => setExpandedRoleCode(isExpanded ? null : (role.job_code || role.role))}
                                  className="self-start text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 py-1 px-3 bg-sky-50 rounded-lg hover:bg-sky-100 transition-all"
                                >
                                  {isExpanded ? '詳細仕様を閉じる' : 'この職種の標準仕様と求人連携を見る'}
                                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {isExpanded && (
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 text-slate-700 space-y-4 animate-in fade-in duration-300">
                                        {masterJob ? (
                                            <>
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">厚生労働省定義の標準実務概要</p>
                                                    <p className="text-xs leading-relaxed font-medium text-slate-600">{masterJob.description}</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">身に付く/期待される核となるスキル</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {masterJob.requiredSkills.map(ski => (
                                                            <span key={ski} className="text-[10px] bg-white border border-slate-300/80 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                                                                {ski}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-500 font-medium">※ 標準職種仕様は定義済みマスタでのみロード可能です。</p>
                                        )}

                                        <div className="pt-3 border-t border-slate-200/60 space-y-3">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                <span>実務支援機関連携（ハローワーク / job-tag）</span>
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <a 
                                                  href={helloWorkUrl} 
                                                  target="_blank" 
                                                  referrerPolicy="no-referrer"
                                                  className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 p-3 rounded-xl transition-all group"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <span>ハローワークの求人を検索</span>
                                                    </span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                                <a 
                                                  href={jobTagUrl} 
                                                  target="_blank" 
                                                  referrerPolicy="no-referrer"
                                                  className="flex items-center justify-between text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/80 hover:bg-sky-100 p-3 rounded-xl transition-all group"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <span>厚生労働省 job-tag 情報を見る</span>
                                                    </span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-normal font-medium">※上のボタンをクリックすると、外部ブラウザタブで厚生労働省の公開求人（ハローワーク等）や公式職業分析データベースに直接連携し、未経験歓迎のリアルの就労案件・要件をクイック検索できます。</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
              </div>
            </section>
            
            {/* Skills to Develop */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-xl shadow-sm"><LightbulbIcon /></div>
                <h3 className="text-xl font-bold text-slate-800">伸ばすと良いスキル</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.skillsToDevelop?.map(skill => (
                  <div key={skill.skill} className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl">
                    <h4 className="font-bold text-emerald-900 text-lg mb-2">{skill.skill}</h4>
                    <p className="text-sm text-emerald-800/70 leading-relaxed font-medium">{skill.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Learning Resources */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-violet-100 text-violet-600 p-2.5 rounded-xl shadow-sm"><LinkIcon /></div>
                <h3 className="text-xl font-bold text-slate-800">おすすめ学習リソース</h3>
              </div>
              <div className="space-y-3">
                {result.learningResources?.map(resource => {
                  const searchQuery = encodeURIComponent(`${resource.provider} ${resource.title}`);
                  const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
                  return (
                  <a href={searchUrl} target="_blank" rel="noopener noreferrer" key={resource.title} className="block bg-white p-5 rounded-2xl hover:bg-slate-50 border border-slate-200 hover:border-violet-300 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between gap-4">
                       <h4 className="font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{resource.title}</h4>
                       <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0">{resource.type}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                       <p className="text-sm text-slate-500 font-medium">提供元: <span className="font-bold text-slate-700">{resource.provider}</span></p>
                       <span className="text-violet-400 group-hover:translate-x-1 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                       </span>
                    </div>
                  </a>
                  );
                })}
              </div>
            </section>

          </div>
        )
    }

    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 backdrop-blur-md transition-all duration-300" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-3">
            <TargetIcon className="w-7 h-7 text-sky-600"/>
            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">適性診断レポート</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div className="p-6 sm:p-10 flex-1 overflow-y-auto scroll-smooth">
          {renderContent()}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 text-right z-10">
           <button 
            onClick={onClose} 
            className="px-8 py-3 bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-100 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 transition-all active:scale-95"
          >
            レポートを閉じる
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SkillMatchingModal;
