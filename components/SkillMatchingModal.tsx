
// components/SkillMatchingModal.tsx - v4.33 - Text Alignment Fix
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { SkillMatchingResult, AnalysisStateItem } from '../types';
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
                <h3 className="text-xl font-bold text-slate-800">おすすめの職種・役割</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {result.recommendedRoles?.map(role => (
                    <div key={role.role} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-sky-300 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start gap-4 mb-3">
                            <h4 className="font-bold text-lg text-slate-800 group-hover:text-sky-700 transition-colors">{role.role}</h4>
                            <div className="text-right flex-shrink-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</p>
                                <p className="font-black text-2xl text-sky-600 leading-tight">{role.matchScore}%</p>
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner">
                            <div className="bg-sky-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${role.matchScore}%` }}></div>
                        </div>
                        <p className="text-sm text-slate-600 mt-4 leading-relaxed font-medium">{role.reason}</p>
                    </div>
                ))}
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
