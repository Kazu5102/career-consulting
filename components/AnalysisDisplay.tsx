
// components/AnalysisDisplay.tsx - v2.72 - Expert Gap Navigator
import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { TrajectoryAnalysisData, AnalysisStateItem, ReframedSkill } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import TrajectoryIcon from './icons/TrajectoryIcon';
import TargetIcon from './icons/TargetIcon';
import BrainIcon from './icons/BrainIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface AnalysisDisplayProps {
    trajectoryState?: AnalysisStateItem<TrajectoryAnalysisData>;
    comprehensiveState?: AnalysisStateItem<any>;
}

const ANALYSIS_PHASES = [
    { threshold: 25, label: "対話ログのスキャンを実行中...", detail: "言語パターンの抽出と文脈の解析" },
    { threshold: 50, label: "発達段階と実年齢の乖離を分析中...", detail: "臨床的観点からの心理推論エンジンの実行" },
    { threshold: 75, label: "日常語からスキルの再定義を試行中...", detail: "潜在的な強みの専門的言語化" },
    { threshold: 95, label: "最終的な介入戦略を構造化しています...", detail: "トリアージ判定とセッション開始案の作成" }
];

const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '' };
    return { __html: marked.parse(markdownText, { breaks: true, gfm: true }) as string };
};

const DeepAnalysisLoader: React.FC = () => {
    const [progress, setProgress] = useState(0);
    const [phaseIndex, setPhaseIndex] = useState(0);

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
                        <h3 className="font-bold text-slate-800 text-lg">{currentPhase.label}</h3>
                    </div>
                    <span className="text-3xl font-black text-slate-200 tabular-nums">{Math.floor(progress)}%</span>
                </div>
                
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner mb-6 relative">
                    <div 
                        className="h-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all duration-300 ease-out relative" 
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        <span className="font-bold text-slate-700">解析プロセス:</span> {currentPhase.detail}
                    </p>
                </div>

                <p className="text-[10px] text-slate-400 text-center mt-10 font-bold uppercase tracking-widest animate-pulse">
                    Expert Analysis Engine v2.72 Processing
                </p>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />
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
    return (
        <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider uppercase ${colorClass}`}>
            {label}
        </span >
    );
};

const GapNavigator: React.FC<{ data: TrajectoryAnalysisData }> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="mt-4 border border-indigo-100 rounded-2xl bg-indigo-50/30 overflow-hidden transition-all">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg"><BrainIcon className="w-4 h-4" /></div>
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Gap Navigator: 臨床的見立て</span>
                </div>
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon className="w-4 h-4 text-indigo-400" />
                </div>
            </button>
            {isExpanded && (
                <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Theoretical Basis (理論的背景)</p>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.theoryBasis || '理論的裏付けを抽出中...'}</p>
                    </div>
                    <div className="p-4 bg-white/60 rounded-xl border border-indigo-100/50 shadow-sm">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Expert Strategy
                        </p>
                        <p className="text-sm text-slate-800 leading-relaxed font-bold italic">「{data.expertAdvice || '戦略的なアドバイスを生成中...'}」</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const ReframedSkillTable: React.FC<{ skills: ReframedSkill[] }> = ({ skills }) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                    <th className="px-5 py-4 w-1/3">本人の「日常語」</th>
                    <th className="px-5 py-4">専門的スキルへのリフレーミング</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {skills.map((s, i) => (
                    <tr key={i} className="hover:bg-sky-50/30 transition-colors">
                        <td className="px-5 py-4 font-medium text-slate-700 italic">「{s.userWord}」</td>
                        <td className="px-5 py-4">
                            <div className="font-bold text-sky-700 text-base">{s.professionalSkill}</div>
                            <div className="text-xs text-slate-500 mt-1 leading-relaxed">{s.insight}</div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const GapChart: React.FC<{ gap: number }> = ({ gap }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-end mb-4">
            <div>
                <h3 className="font-bold text-slate-800">Age-Stage Gap (深層心理の乖離)</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Developmental Discrepancy Index</p>
            </div>
            <span className={`text-3xl font-black ${gap > 60 ? 'text-rose-500' : gap > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{gap}%</span>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner flex">
            <div 
                className={`h-full transition-all duration-1000 ease-out ${gap > 60 ? 'bg-rose-500' : gap > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                style={{ width: `${gap}%` }}
            ></div>
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 px-1">
            <span>STABLE</span>
            <span>CRITICAL</span>
        </div>
    </div>
);

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ trajectoryState, comprehensiveState }) => {
    const currentState = trajectoryState || comprehensiveState;
    if (!currentState || currentState.status === 'idle') return null;
    const { status, data, error } = currentState;

    if (status === 'loading') return <DeepAnalysisLoader />;

    if (status === 'error') return (
        <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold animate-in shake duration-500">
            分析エラー: {error}
        </div>
    );

    if (!data) return null;

    if ('triageLevel' in data) {
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
                    <div>
                        <GapChart gap={data.ageStageGap} />
                        <GapNavigator data={data} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="bg-sky-100 text-sky-600 p-2 rounded-xl"><TrajectoryIcon className="w-5 h-5"/></div>
                            <h3 className="font-bold text-slate-800">主要な臨床的指摘</h3>
                        </div>
                        <ul className="space-y-3">
                            {data.keyTakeaways.map((t: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed font-medium">
                                    <span className="text-sky-500 font-black mt-0.5">•</span>
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <section>
                    <div className="flex items-center gap-3 mb-5 px-1">
                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><TargetIcon className="w-5 h-5"/></div>
                        <h3 className="font-bold text-slate-800 text-xl tracking-tight">スキル・リフレーミング (強みの再定義)</h3>
                    </div>
                    <ReframedSkillTable skills={data.reframedSkills} />
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><TrajectoryIcon className="w-5 h-5"/></div>
                        <h3 className="font-bold text-slate-800 text-xl tracking-tight">ナラティブ・サマリー</h3>
                    </div>
                    <div 
                        className="prose prose-slate max-w-none text-slate-700 prose-p:leading-relaxed prose-li:my-1" 
                        dangerouslySetInnerHTML={createMarkup(data.overallSummary)} 
                    />
                </section>
            </div>
        );
    }

    return (
        <div className="space-y-6">
             <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={createMarkup(data.overallInsights)} />
        </div>
    );
};

export default AnalysisDisplay;
