
// components/AnalysisDisplay.tsx - v2.92 - Clinical Supervised Reflection Upgrade
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { TrajectoryAnalysisData, AnalysisStateItem, SkillMatchingResult } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import TrajectoryIcon from './icons/TrajectoryIcon';
import TargetIcon from './icons/TargetIcon';
import BrainIcon from './icons/BrainIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import LinkIcon from './icons/LinkIcon';
import AnalyticsIcon from './icons/AnalyticsIcon';

interface AnalysisDisplayProps {
    trajectoryState?: AnalysisStateItem<TrajectoryAnalysisData>;
    skillMatchingState?: AnalysisStateItem<SkillMatchingResult>;
    comprehensiveState?: AnalysisStateItem<any>;
}

const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '' };
    return { __html: marked.parse(markdownText, { breaks: true, gfm: true }) as string };
};

const DeepAnalysisLoader: React.FC<{ label?: string }> = ({ label }) => {
    const [progress, setProgress] = useState(0);
    const [phaseIndex, setPhaseIndex] = useState(0);

    const ANALYSIS_PHASES = [
        { threshold: 25, label: "対話ログのスキャンを実行中...", detail: "言語パターンの抽出と文脈の解析" },
        { threshold: 50, label: "臨床的観点からの心理推論中...", detail: "発達段階と実年齢の乖離、深層心理の分析" },
        { threshold: 75, label: "スキルの再定義・適正診断中...", detail: "潜在的な強みの専門的言語化と市場マッチング" },
        { threshold: 95, label: "最終的な介入戦略を構造化中...", detail: "トリアージ判定とセッション開始案の作成" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev < 98) {
                    const increment = prev < 30 ? 0.7 : prev < 70 ? 0.3 : 0.1;
                    const next = prev + increment;
                    const nextPhase = ANALYSIS_PHASES.findIndex(p => next < p.threshold);
                    if (nextPhase !== -1 && nextPhase !== phaseIndex) setPhaseIndex(nextPhase);
                    return next;
                }
                return prev;
            });
        }, 100);
        return () => clearInterval(interval);
    }, [phaseIndex]);

    const currentPhase = ANALYSIS_PHASES[phaseIndex] || ANALYSIS_PHASES[ANALYSIS_PHASES.length - 1];

    return (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px] animate-in fade-in duration-500">
            <div className="w-full max-w-md">
                <div className="flex justify-between items-end mb-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                            Phase {phaseIndex + 1} / 4
                        </p>
                        <h3 className="font-bold text-slate-800 text-lg">{label || currentPhase.label}</h3>
                    </div>
                    <span className="text-3xl font-black text-slate-200 tabular-nums">{Math.floor(progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner mb-6 relative">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-300 ease-out relative" style={{ width: `${progress}%` }}>
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        <span className="font-bold text-slate-700">解析プロセス:</span> {currentPhase.detail}
                    </p>
                </div>
            </div>
        </div>
    );
};

const TriageBadge: React.FC<{ level: string }> = ({ level }) => {
    const colors = {
        high: 'bg-rose-100 text-rose-700 border-rose-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    const labels = { high: '要介入 (High)', medium: '経過観察 (Medium)', low: '安定 (Low)' };
    const colorClass = colors[level as keyof typeof colors] || colors.low;
    const label = labels[level as keyof typeof labels] || '不明';
    return <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider uppercase ${colorClass}`}>{label}</span>;
};

const TrajectoryContent: React.FC<{ data: TrajectoryAnalysisData }> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                        <TriageBadge level={data.triageLevel} />
                        <h2 className="text-2xl font-black tracking-tight">介入戦略インサイト</h2>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">相談履歴から抽出された臨床的観点。面談前の「見立て」を補完します。</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex-shrink-0 w-full sm:w-80">
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <SparklesIcon className="w-3 h-3"/> Session Starter
                    </p>
                    <p className="text-sm font-bold italic leading-relaxed">「{data.sessionStarter}」</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="font-bold text-slate-800">Age-Stage Gap (深層心理の乖離)</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Developmental Index</p>
                            </div>
                            <span className={`text-3xl font-black ${data.ageStageGap > 60 ? 'text-rose-500' : data.ageStageGap > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{data.ageStageGap}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner flex">
                            <div className={`h-full transition-all duration-1000 ease-out ${data.ageStageGap > 60 ? 'bg-rose-500' : data.ageStageGap > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${data.ageStageGap}%` }}></div>
                        </div>
                    </div>
                    <div className="border border-indigo-100 rounded-2xl bg-indigo-50/30 overflow-hidden transition-all">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/50 transition-colors">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><BrainIcon className="w-4 h-4" /></div>
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">臨床的見立て</span>
                            </div>
                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}><ChevronDownIcon className="w-4 h-4 text-indigo-400" /></div>
                        </button>
                        {isExpanded && (
                            <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Theoretical Basis</p>
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.theoryBasis}</p>
                                </div>
                                <div className="p-4 bg-white/60 rounded-xl border border-indigo-100/50 shadow-sm">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Expert Advice</p>
                                    <p className="text-sm text-slate-800 leading-relaxed font-bold italic">「{data.expertAdvice}」</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-sky-100 text-sky-600 p-2 rounded-xl"><TrajectoryIcon className="w-5 h-5"/></div>
                        <h3 className="font-bold text-slate-800">主要な臨床的指摘</h3>
                    </div>
                    <ul className="space-y-3">
                        {data.keyTakeaways.map((t, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed font-medium">
                                <span className="text-sky-500 font-black mt-0.5">•</span>{t}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><TrajectoryIcon className="w-5 h-5"/></div>
                    <h3 className="font-bold text-slate-800 text-xl tracking-tight">ナラティブ・サマリー</h3>
                </div>
                <div className="prose prose-slate max-w-none text-slate-700 prose-p:leading-relaxed" dangerouslySetInnerHTML={createMarkup(data.overallSummary)} />
            </section>
        </div>
    );
};

const ComprehensiveContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden border border-slate-800">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
             <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20"><AnalyticsIcon className="w-8 h-8" /></div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">Macro Strategic Report</h2>
                        <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mt-1">Supervisory Reflection Engine v2.92</p>
                    </div>
                </div>
                <article className="prose prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-lg font-medium" dangerouslySetInnerHTML={createMarkup(data.overallInsights)} />
             </div>
        </section>

        {/* Supervision: THE EDUCATIONAL CORE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-xl"><BrainIcon className="w-6 h-6" /></div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">スーパーバイザーの臨床講義</h3>
                </div>
                <div className="prose prose-slate max-w-none prose-p:text-sm prose-p:leading-relaxed text-slate-700" dangerouslySetInnerHTML={createMarkup(data.theoreticalDeepDive)} />
            </section>

            <section className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-8 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white/10 text-indigo-300 p-2.5 rounded-xl"><LightbulbIcon className="w-6 h-6" /></div>
                        <h3 className="text-xl font-black tracking-tight">自己研鑽のための問い (Reflection)</h3>
                    </div>
                    <div className="space-y-4">
                        {data.reflectionQuestions?.map((q: string, i: number) => (
                            <div key={i} className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                                <span className="text-indigo-400 font-black text-xl leading-none">?</span>
                                <p className="text-sm font-bold leading-relaxed text-slate-200">{q}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 italic font-bold text-center">※これらの問いに向き合うことで、あなたの臨床的メタ認知が向上します。</p>
                </div>
            </section>
        </div>

        {/* Clinical Playbook */}
        <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <div className="bg-sky-100 text-sky-600 p-2.5 rounded-2xl"><TrajectoryIcon className="w-7 h-7" /></div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">臨床介入プレイブック</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.interventionPlaybook?.map((item: any, i: number) => (
                    <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all">
                        <div className="p-5 bg-indigo-50 border-b border-indigo-100">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block mb-1">Pattern 0{i+1}</span>
                            <h4 className="font-bold text-indigo-900">{item.pattern}</h4>
                        </div>
                        <div className="p-6 flex-1 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Recommended Strategy</p>
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.strategy}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <SparklesIcon className="w-3 h-3"/> 臨床的声かけ例
                                </p>
                                <p className="text-sm font-bold text-slate-800 italic leading-relaxed">「{item.phrash}」</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <section className="bg-rose-50 p-8 rounded-3xl border border-rose-100">
            <div className="flex items-center gap-3 mb-6 text-rose-800">
                <div className="bg-rose-100 text-rose-600 p-2.5 rounded-xl"><LightbulbIcon className="w-6 h-6" /></div>
                <h3 className="text-xl font-black tracking-tight">臨床的盲点 (注意喚起)</h3>
            </div>
            <ul className="space-y-3">
                {data.clinicalBlindSpots?.map((spot: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm text-rose-900/80 font-bold leading-relaxed">
                        <span className="text-rose-500 font-black mt-1">!</span>{spot}
                    </li>
                ))}
            </ul>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-inner">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-slate-100 text-slate-600 p-2.5 rounded-xl"><TargetIcon className="w-6 h-6" /></div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">主要なマクロ的要点</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                {data.keyTakeaways?.map((t: string, i: number) => (
                    <li key={i} className="flex gap-3 text-slate-700 font-medium border-b border-slate-50 pb-2">
                        <span className="text-indigo-500 font-black">•</span>{t}
                    </li>
                ))}
            </ul>
        </section>
    </div>
  );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ trajectoryState, skillMatchingState, comprehensiveState }) => {
    if (trajectoryState?.status === 'loading') return <DeepAnalysisLoader label="軌跡・介入戦略を分析中..." />;
    if (skillMatchingState?.status === 'loading') return <DeepAnalysisLoader label="適職・マーケットマッチングを分析中..." />;

    if (trajectoryState?.status === 'error') return <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold">軌跡分析エラー: {trajectoryState.error}</div>;
    if (skillMatchingState?.status === 'error') return <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold">適職診断エラー: {skillMatchingState.error}</div>;

    return (
        <div className="space-y-16">
            {trajectoryState?.status === 'success' && trajectoryState.data && <TrajectoryContent data={trajectoryState.data} />}
            {skillMatchingState?.status === 'success' && skillMatchingState.data && <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100"><h2 className="text-xl font-bold text-emerald-900 mb-4">適性診断レポート</h2><article className="prose max-w-none" dangerouslySetInnerHTML={createMarkup(skillMatchingState.data.analysisSummary)} /></div>}
            {comprehensiveState?.status === 'success' && comprehensiveState.data && <ComprehensiveContent data={comprehensiveState.data} />}
        </div>
    );
};

export default AnalysisDisplay;
