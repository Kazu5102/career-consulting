
// components/AnalysisDisplay.tsx - v3.15 - Guaranteed Visual Exclusivity
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
    return (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[400px] animate-in fade-in duration-500">
            <div className="w-full max-w-md text-center">
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{label || "分析中..."}</h3>
                <p className="text-xs text-slate-400 font-medium">これまでの対話ログを専門家視点で再構成しています。</p>
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
    const labels = { high: '要介入', medium: '経過観察', low: '安定' };
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
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">臨床的観点からの「内的変容」分析。対話パターンの変化を可視化します。</p>
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
                                <h3 className="font-bold text-slate-800">Age-Stage Gap (心理的乖離)</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Developmental Index</p>
                            </div>
                            <span className={`text-3xl font-black ${data.ageStageGap > 60 ? 'text-rose-500' : data.ageStageGap > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{data.ageStageGap}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${data.ageStageGap > 60 ? 'bg-rose-500' : data.ageStageGap > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${data.ageStageGap}%` }}></div>
                        </div>
                    </div>
                    <div className="border border-indigo-100 rounded-2xl bg-indigo-50/30 overflow-hidden">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/50 transition-colors">
                            <div className="flex items-center gap-2.5">
                                <BrainIcon className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">臨床的見立ての詳細</span>
                            </div>
                            <ChevronDownIcon className={`w-4 h-4 text-indigo-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                            <div className="px-5 pb-5 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Theoretical Basis</p>
                                    <p className="text-sm text-slate-700 leading-relaxed">{data.theoryBasis}</p>
                                </div>
                                <div className="p-4 bg-white/60 rounded-xl border border-indigo-100 shadow-sm">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Supervisor Advice</p>
                                    <p className="text-sm text-slate-800 font-bold italic">「{data.expertAdvice}」</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5">
                        <TrajectoryIcon className="w-5 h-5 text-sky-600"/>
                        <h3 className="font-bold text-slate-800">主要な臨床的指摘</h3>
                    </div>
                    <ul className="space-y-3">
                        {data.keyTakeaways.map((t, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed font-medium">
                                <span className="text-sky-50 font-black mt-0.5 px-1.5 py-0.5 rounded bg-sky-500 text-[10px]">{i+1}</span>{t}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <TrajectoryIcon className="w-5 h-5 text-indigo-600"/>
                    <h3 className="font-bold text-slate-800 text-xl tracking-tight">内的変容サマリー</h3>
                </div>
                <div className="prose prose-slate max-w-none text-slate-700" dangerouslySetInnerHTML={createMarkup(data.overallSummary)} />
            </section>
        </div>
    );
};

const SkillMatchingContent: React.FC<{ data: SkillMatchingResult }> = ({ data }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                <div className="flex items-center gap-3 mb-6">
                    <TargetIcon className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-xl font-extrabold text-emerald-900 tracking-tight">適職診断・市場価値レポート</h3>
                </div>
                <article className="prose prose-emerald max-w-none prose-p:text-emerald-800" dangerouslySetInnerHTML={createMarkup(data.analysisSummary)} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5">
                        <BriefcaseIcon className="w-5 h-5 text-sky-600" />
                        <h3 className="font-bold text-slate-800">推奨ロールと適合根拠</h3>
                    </div>
                    <div className="space-y-4">
                        {data.recommendedRoles?.map((role, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-200 transition-colors">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-slate-800">{role.role}</span>
                                    <span className="text-sky-600 font-black text-lg">{role.matchScore}%</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{role.reason}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5">
                        <LightbulbIcon className="w-5 h-5 text-amber-600" />
                        <h3 className="font-bold text-slate-800">市場価値向上のための学習項目</h3>
                    </div>
                    <div className="space-y-4">
                        {data.skillsToDevelop?.map((skill, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-amber-50/30 rounded-xl border border-amber-100/30">
                                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-black text-xs">{i+1}</div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm mb-1">{skill.skill}</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">{skill.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ trajectoryState, skillMatchingState }) => {
    // ローディング中はいずれか一方を表示
    if (trajectoryState?.status === 'loading') return <DeepAnalysisLoader label="軌跡・内的変容を分析中..." />;
    if (skillMatchingState?.status === 'loading') return <DeepAnalysisLoader label="適職・市場的価値を分析中..." />;

    // エラー表示
    if (trajectoryState?.status === 'error') return <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold">軌跡分析エラー: {trajectoryState.error}</div>;
    if (skillMatchingState?.status === 'error') return <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold">適職診断エラー: {skillMatchingState.error}</div>;

    return (
        <div className="space-y-12">
            {/* 完全排他表示ロジック: 
                AdminView側で実行時に他方を idle/null にリセットしているため、
                ここでも success 且つデータが存在する方のみを表示する。
            */}
            {trajectoryState?.status === 'success' && trajectoryState.data && (
                <TrajectoryContent data={trajectoryState.data} />
            )}
            
            {skillMatchingState?.status === 'success' && skillMatchingState.data && (
                <SkillMatchingContent data={skillMatchingState.data} />
            )}
        </div>
    );
};

export default AnalysisDisplay;
