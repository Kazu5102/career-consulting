
// views/AnalysisDashboard.tsx - v2.92 - Supervisory Reflection Logic
import React, { useState, useEffect } from 'react';
import { StoredConversation, AnalysisStateItem } from '../types';
import { analyzeConversations } from '../services/index';
import AnalyticsIcon from '../components/icons/AnalyticsIcon';
import AnalysisDisplay from '../components/AnalysisDisplay';

interface Props {
  conversations: StoredConversation[];
}

const GLOBAL_ANALYSIS_PHASES = [
    { threshold: 25, label: "言語的徴候のスキャン...", detail: "対話ログから主訴、感情、キーワードを臨床的に抽出・コーディング" },
    { threshold: 50, label: "潜在的力動の解析実行中...", detail: "相談者の内的葛藤、防衛機制、適応課題の構造的パターンを特定" },
    { threshold: 75, label: "理論的パラダイムの統合中...", detail: "サビカス、スーパー、SCCT等のキャリア理論に基づき、事例の全体像を解釈" },
    { threshold: 95, label: "教育的リフレクションの構築...", detail: "実務者への内省を促す問いと、高度な介入プレイブックを最終生成" }
];

const GlobalAnalysisLoader: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [phaseIndex, setPhaseIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev < 98) {
                    const increment = prev < 30 ? 0.6 : prev < 70 ? 0.25 : 0.08;
                    const next = prev + increment;
                    const nextPhase = GLOBAL_ANALYSIS_PHASES.findIndex(p => next < p.threshold);
                    if (nextPhase !== -1 && nextPhase !== phaseIndex) setPhaseIndex(nextPhase);
                    return next;
                }
                return prev;
            });
        }, 120);
        return () => clearInterval(interval);
    }, [phaseIndex]);

    const currentPhase = GLOBAL_ANALYSIS_PHASES[phaseIndex] || GLOBAL_ANALYSIS_PHASES[GLOBAL_ANALYSIS_PHASES.length - 1];

    return (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[450px] animate-in fade-in duration-500">
            <div className="w-full max-lg lg:max-w-xl">
                <div className="flex justify-between items-end mb-5">
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            Supervisory Insight Engine: Phase {phaseIndex + 1} / 4
                        </p>
                        <h3 className="font-black text-slate-800 text-xl">{currentPhase.label}</h3>
                    </div>
                    <span className="text-4xl font-black text-slate-100 tabular-nums">{Math.floor(progress)}%</span>
                </div>
                
                <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden shadow-inner mb-8 relative">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all duration-300 ease-out relative" 
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>

                <div className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100 shadow-sm">
                    <p className="text-sm text-indigo-900 font-bold leading-relaxed">
                        <span className="text-indigo-600">現在実行中のプロセス:</span> {currentPhase.detail}
                    </p>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-indigo-100">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Supervisor Context Mapping Active</p>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}} />
        </div>
    );
};

const AnalysisDashboard: React.FC<Props> = ({ conversations }) => {
  const [analysisState, setAnalysisState] = useState<AnalysisStateItem<any>>({ status: 'idle', data: null, error: null });

  const handleRunAnalysis = async () => {
    if (conversations.length < 2) {
      alert("分析には少なくとも2件の相談履歴が必要です。");
      return;
    }
    setAnalysisState({ status: 'loading', data: null, error: null });
    try {
      const result = await analyzeConversations(conversations);
      setAnalysisState({ status: 'success', data: result, error: null });
    } catch (err) {
      console.error("Failed to generate analysis:", err);
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました。";
      setAnalysisState({ status: 'error', data: null, error: `分析中にエラーが発生しました: ${errorMessage}` });
    }
  };

  const { status, data, error } = analysisState;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><AnalyticsIcon className="w-6 h-6" /></div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">臨床教育マクロ分析レポート</h2>
        </div>
        <button
            onClick={handleRunAnalysis}
            disabled={status === 'loading' || conversations.length < 2}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed"
        >
            <AnalyticsIcon />
            {status === 'loading' ? '事例指導データを構成中...' : '臨床総合分析を実行'}
        </button>
      </div>
      
      <div className="flex-1 bg-slate-50/50 rounded-3xl p-6 overflow-y-auto">
          {status === 'loading' && <GlobalAnalysisLoader />}
          
          {status === 'error' && error && (
              <div className="flex flex-col items-center justify-center h-full text-center text-rose-600 bg-rose-50 p-10 rounded-3xl border border-rose-100 shadow-sm animate-in shake duration-500">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 className="font-black text-xl">分析エラー</h3>
                  <p className="mt-2 font-medium opacity-80">{error}</p>
                  <button onClick={() => setAnalysisState({ status: 'idle', data: null, error: null })} className="mt-6 px-6 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors">再試行</button>
              </div>
          )}
          
          {status === 'success' && data && (
              <AnalysisDisplay comprehensiveState={analysisState} />
          )}
          
          {status === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-20">
                  <div className="p-10 bg-white rounded-full shadow-inner mb-6">
                    <AnalyticsIcon className="w-20 h-20 text-slate-200" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-700">臨床マクロ解析の準備</h3>
                  <p className="mt-3 leading-relaxed max-w-sm font-medium">
                    複数の相談履歴を横断的に解析し、現場のコンサルタントが陥りやすい盲点や、効果的な介入シナリオを学習リソースとして提供します。
                  </p>
                  <div className="mt-8 px-5 py-2 bg-white border border-slate-200 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest shadow-sm">
                    {conversations.length} Sessions Available
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default AnalysisDashboard;
