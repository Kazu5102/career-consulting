
// components/AnalysisDisplay.tsx - v3.19 - Enhanced Error Guidance
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

const AnalysisErrorFallback: React.FC<{ type: string; error: string }> = ({ type, error }) => {
    const isDataShortage = error.includes("2回以上") || error.includes("履歴が1件") || error.includes("ありません");
    const isSafetyBlock = error.includes("セーフティ") || error.includes("フィルタ") || error.includes("不適切");
    const isTooThin = error.includes("極端に少ない") || error.includes("素材が不足");

    return (
        <div className="p-10 bg-white rounded-[3rem] border border-amber-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex-1 space-y-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                            {type}の実行ができませんでした
                        </h3>
                        <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 mb-6">
                            <p className="text-amber-900 font-bold leading-relaxed">{error}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <LightbulbIcon className="w-4 h-4 text-amber-500" />
                            分析を成功させるためのヒント
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {isDataShortage ? (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <p className="text-sm font-black text-slate-800 mb-2">1. セッションを増やす</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        内的変容を捉えるには「過去」と「現在」の比較が必要です。あと1回セッションを行うか、過去のメールログ等を外部データインポート機能で追加してください。
                                    </p>
                                </div>
                            ) : isTooThin ? (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <p className="text-sm font-black text-slate-800 mb-2">1. サマリー情報を充実させる</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        現在の要約には臨床的な見立てに必要な「感情の揺れ」や「経歴の詳細」が不足しています。履歴一覧から各要約を編集し、情報を追記してみてください。
                                    </p>
                                </div>
                            ) : isSafetyBlock ? (
                                <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100">
                                    <p className="text-sm font-black text-rose-900 mb-2">1. 表現のデトックス</p>
                                    <p className="text-xs text-rose-700 leading-relaxed font-medium">
                                        死生観や極度の暴力表現が含まれていると、AIの倫理フィルタが作動します。専門的な用語を使いつつ、客観的な記述に書き換えることで分析が通るようになります。
                                    </p>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                    <p className="text-sm font-black text-slate-800 mb-2">1. 通信状態の確認と再試行</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        サーバーが一時的に混み合っている可能性があります。画面をリロードし、数分置いてから再度実行ボタンを押してください。
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DeepAnalysisLoader: React.FC<{ type: 'trajectory' | 'skillMatching'; label?: string }> = ({ type }) => {
    const [progress, setProgress] = useState(0);
    const phases = type === 'trajectory' ? [
        { threshold: 30, label: "セッションログの走査中...", detail: "対話の文脈からキーワードを抽出中" },
        { threshold: 60, label: "心理力動の解析中...", detail: "防衛機制と内的変容をマッピング" },
        { threshold: 100, label: "臨床レポートの生成中...", detail: "理論に基づき介入プランを構成" }
    ] : [
        { threshold: 30, label: "スキルの翻訳中...", detail: "経験を市場価値へ変換" },
        { threshold: 60, label: "労働市場のマッチング中...", detail: "職域ポテンシャルを特定" },
        { threshold: 100, label: "診断結果の統合中...", detail: "ロードマップを生成" }
    ];

    useEffect(() => {
        const timer = setInterval(() => setProgress(p => p < 98 ? p + 0.5 : p), 200);
        return () => clearInterval(timer);
    }, []);

    const phase = phases.find(p => progress < p.threshold) || phases[phases.length-1];

    return (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-200 min-h-[400px] animate-in fade-in duration-500">
            <div className="w-24 h-24 border-4 border-slate-100 rounded-full mb-8 relative">
                <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">{phase.label}</h3>
            <p className="text-sm text-slate-400 font-bold mb-8 uppercase tracking-widest">{phase.detail}</p>
            <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

const TrajectoryContent: React.FC<{ data: TrajectoryAnalysisData }> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const colors = { high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };
    const triageLabels = { high: '要介入', medium: '経過観察', low: '安定' };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider uppercase ${colors[data.triageLevel] || colors.low}`}>
                            {triageLabels[data.triageLevel] || '不明'}
                        </span>
                        <h2 className="text-2xl font-black tracking-tight">介入戦略インサイト</h2>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">臨床的観点からの「内的変容」分析。対話パターンの変化を可視化します。</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex-shrink-0 w-full sm:w-80">
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 flex items-center gap-2"><SparklesIcon className="w-3 h-3"/> Session Starter</p>
                    <p className="text-sm font-bold italic leading-relaxed">「{data.sessionStarter}」</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-end mb-4">
                            <div><h3 className="font-bold text-slate-800">Age-Stage Gap (心理的乖離)</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Developmental Index</p></div>
                            <span className={`text-3xl font-black ${data.ageStageGap > 60 ? 'text-rose-500' : data.ageStageGap > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>{data.ageStageGap}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${data.ageStageGap > 60 ? 'bg-rose-500' : data.ageStageGap > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${data.ageStageGap}%` }}></div>
                        </div>
                    </div>
                    <div className="border border-indigo-100 rounded-2xl bg-indigo-50/30 overflow-hidden">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/50 transition-colors">
                            <div className="flex items-center gap-2.5"><BrainIcon className="w-4 h-4 text-indigo-600" /><span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">臨床的見立ての詳細</span></div>
                            <ChevronDownIcon className={`w-4 h-4 text-indigo-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                            <div className="px-5 pb-5 space-y-4">
                                <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Theoretical Basis</p><p className="text-sm text-slate-700 leading-relaxed">{data.theoryBasis}</p></div>
                                <div className="p-4 bg-white/60 rounded-xl border border-indigo-100 shadow-sm"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Supervisor Advice</p><p className="text-sm text-slate-800 font-bold italic">「{data.expertAdvice}」</p></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5"><TrajectoryIcon className="w-5 h-5 text-sky-600"/><h3 className="font-bold text-slate-800">主要な臨床的指摘</h3></div>
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
                <div className="flex items-center gap-3 mb-6"><TrajectoryIcon className="w-5 h-5 text-indigo-600"/><h3 className="font-bold text-slate-800 text-xl tracking-tight">内的変容サマリー</h3></div>
                <div className="prose prose-slate max-w-none text-slate-700" dangerouslySetInnerHTML={createMarkup(data.overallSummary)} />
            </section>
        </div>
    );
};

const SkillMatchingContent: React.FC<{ data: SkillMatchingResult }> = ({ data }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                <div className="flex items-center gap-3 mb-6"><TargetIcon className="w-5 h-5 text-emerald-600" /><h3 className="text-xl font-extrabold text-emerald-900 tracking-tight">適職診断・市場価値レポート</h3></div>
                <article className="prose prose-emerald max-w-none prose-p:text-emerald-800" dangerouslySetInnerHTML={createMarkup(data.analysisSummary)} />
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5"><BriefcaseIcon className="w-5 h-5 text-sky-600" /><h3 className="font-bold text-slate-800">推奨ロールと適合根拠</h3></div>
                    <div className="space-y-4">
                        {data.recommendedRoles?.map((role, i) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-sky-200 transition-colors">
                                <div className="flex justify-between items-center mb-2"><span className="font-black text-slate-800">{role.role}</span><span className="text-sky-600 font-black text-lg">{role.matchScore}%</span></div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">{role.reason}</p>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5"><LightbulbIcon className="w-5 h-5 text-amber-600" /><h3 className="font-bold text-slate-800">市場価値向上のための学習項目</h3></div>
                    <div className="space-y-4">
                        {data.skillsToDevelop?.map((skill, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-amber-50/30 rounded-xl border border-amber-100/30">
                                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-black text-xs">{i+1}</div>
                                <div><p className="font-bold text-slate-800 text-sm mb-1">{skill.skill}</p><p className="text-xs text-slate-500 leading-relaxed">{skill.reason}</p></div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ trajectoryState, skillMatchingState }) => {
    if (trajectoryState?.status === 'loading') return <DeepAnalysisLoader type="trajectory" />;
    if (skillMatchingState?.status === 'loading') return <DeepAnalysisLoader type="skillMatching" />;

    if (trajectoryState?.status === 'error' && trajectoryState.error) {
        return <AnalysisErrorFallback type="軌跡分析" error={trajectoryState.error} />;
    }
    if (skillMatchingState?.status === 'error' && skillMatchingState.error) {
        return <AnalysisErrorFallback type="適職診断" error={skillMatchingState.error} />;
    }

    return (
        <div className="space-y-12">
            {trajectoryState?.status === 'success' && trajectoryState.data && <TrajectoryContent data={trajectoryState.data} />}
            {skillMatchingState?.status === 'success' && skillMatchingState.data && <SkillMatchingContent data={skillMatchingState.data} />}
        </div>
    );
};

export default AnalysisDisplay;
