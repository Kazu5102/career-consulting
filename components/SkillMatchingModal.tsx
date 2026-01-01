
import React from 'react';
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


const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
};

const SkillMatchingModal: React.FC<SkillMatchingModalProps> = ({ isOpen, onClose, analysisState }) => {
  
  if (!isOpen) return null;
  
  const { status, data: result, error } = analysisState;

  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-600 p-8 text-center">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-lg font-semibold">AIがあなたのキャリアを分析中です...</p>
          <p className="text-sm text-slate-500 mt-2">これには1分ほどかかる場合があります。</p>
        </div>
      );
    }

    if (status === 'error' && error) {
       return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-600 bg-red-50 p-8 rounded-lg">
            <h3 className="font-bold text-lg">エラーが発生しました</h3>
            <p className="mt-2 text-sm">{error}</p>
        </div>
      );
    }
    
    if (status === 'success' && result) {
        return (
          <div className="space-y-8">
            {/* Analysis Summary */}
            <section>
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-4">あなたのキャリアプロファイル</h3>
              <article className="prose prose-slate max-w-none prose-sm" dangerouslySetInnerHTML={createMarkup(result?.analysisSummary)} />
            </section>

            {/* Recommended Roles */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-sky-100 text-sky-600 p-2 rounded-lg"><BriefcaseIcon /></div>
                <h3 className="text-xl font-bold text-slate-800">おすすめの職種</h3>
              </div>
              <div className="space-y-4">
                {result.recommendedRoles?.map(role => (
                    <div key={role.role} className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                        <div className="flex justify-between items-start gap-4">
                            <h4 className="font-bold text-md text-sky-800">{role.role}</h4>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs text-slate-500">マッチ度</p>
                                <p className="font-bold text-lg text-sky-600">{role.matchScore}%</p>
                            </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 my-2">
                            <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${role.matchScore}%` }}></div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{role.reason}</p>
                    </div>
                ))}
              </div>
            </section>
            
            {/* Skills to Develop */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><LightbulbIcon /></div>
                <h3 className="text-xl font-bold text-slate-800">伸ばすと良いスキル</h3>
              </div>
              <div className="space-y-3">
                {result.skillsToDevelop?.map(skill => (
                  <div key={skill.skill} className="bg-slate-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-emerald-800">{skill.skill}</h4>
                    <p className="text-sm text-slate-600">{skill.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Learning Resources */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-violet-100 text-violet-600 p-2 rounded-lg"><LinkIcon /></div>
                <h3 className="text-xl font-bold text-slate-800">おすすめ学習リソース</h3>
              </div>
              <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded-md mb-4">
                リンク切れを防ぎ、常に最新の情報にアクセスできるよう、直接のリンクの代わりに検索リンクを提供しています。タイトルと提供元をご確認の上、公式サイトからアクセスしてください。
              </p>
              <div className="space-y-2">
                {result.learningResources?.map(resource => {
                  const searchQuery = encodeURIComponent(`${resource.provider} ${resource.title}`);
                  const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
                  return (
                  <a href={searchUrl} target="_blank" rel="noopener noreferrer" key={resource.title} className="block bg-slate-50 p-3 rounded-lg hover:bg-slate-100 hover:shadow-sm transition-all border border-slate-200 group">
                    <div className="flex items-center justify-between">
                       <h4 className="font-semibold text-violet-800 group-hover:underline">{resource.title}</h4>
                       <span className="text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{resource.type}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">提供元: <span className="font-semibold">{resource.provider}</span></p>
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <TargetIcon className="w-6 h-6 text-sky-600"/>
            <h2 className="text-xl font-bold text-slate-800">適性診断・スキルマッチング レポート</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <div className="p-6 flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        <footer className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl text-right flex-shrink-0">
           <button 
            onClick={onClose} 
            className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
          >
            閉じる
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SkillMatchingModal;