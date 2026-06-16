
// components/AnalysisDisplay.tsx - v6.43 - 2026-06-16 - Add dynamic warning banners, sliding multi-stage scoring bar, and typing fluency silence graph for board demo
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
import ClipboardIcon from './icons/ClipboardIcon';

interface AnalysisDisplayProps {
    trajectoryState?: AnalysisStateItem<TrajectoryAnalysisData>;
    skillMatchingState?: AnalysisStateItem<SkillMatchingResult>;
    comprehensiveState?: AnalysisStateItem<any>;
}

const TRAJECTORY_PHASES = [
    { threshold: 15, label: "コンテキストの初期化...", detail: "相談履歴データの構造化と時系列ソートを実行中" },
    { threshold: 40, label: "マイクロ・ナラティブ解析...", detail: "発言の揺れ、感情価の変動、未言及の空白を検出" },
    { threshold: 70, label: "心理的発達段階の推定...", detail: "キャリア構築理論に基づくライフテーマの同定" },
    { threshold: 90, label: "臨床的インサイトの生成...", detail: "介入戦略と次回セッションへの示唆を策定中" }
];

const SKILL_MATCHING_PHASES = [
    { threshold: 15, label: "スキルセットの抽出...", detail: "業務経験からのコンピテンシー分解と強みの特定" },
    { threshold: 45, label: "ギャップ分析の実行...", detail: "希望職種と現状スキルの乖離度を定量的評価" },
    { threshold: 75, label: "学習リソースの照合...", detail: "市場価値向上に必要な具体的アクションの選定" },
    { threshold: 90, label: "適合度スコアリング...", detail: "キャリアパスシナリオの適合率を算出中" }
];

const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '' };
    return { __html: marked.parse(markdownText, { breaks: true, gfm: true }) as string };
};

const AnalysisErrorFallback: React.FC<{ type: string; error: string }> = ({ type, error }) => {
    const isDataShortage = error.includes("2回以上") || error.includes("履歴が1件") || error.includes("ありません");
    return (
        <div className="p-10 bg-white rounded-[3rem] border border-amber-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{type}の実行ができませんでした</h3>
                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 mb-6">
                        <p className="text-amber-900 font-bold leading-relaxed">{error}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProgressiveAnalysisLoader: React.FC<{ type: 'trajectory' | 'skillMatching' }> = ({ type }) => {
    const [progress, setProgress] = useState(0);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const phases = type === 'trajectory' ? TRAJECTORY_PHASES : SKILL_MATCHING_PHASES;
    const accentColor = type === 'trajectory' ? 'sky' : 'emerald';

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev < 99) {
                    // Slow down as we approach the end to simulate heavy computation waiting for API
                    const increment = prev < 30 ? 1.5 : prev < 70 ? 0.8 : 0.2;
                    const next = Math.min(prev + increment, 99);
                    
                    const nextPhaseIndex = phases.findIndex(p => next < p.threshold);
                    if (nextPhaseIndex !== -1 && nextPhaseIndex !== phaseIndex) {
                        setPhaseIndex(nextPhaseIndex);
                    } else if (next >= phases[phases.length - 1].threshold) {
                        setPhaseIndex(phases.length - 1);
                    }
                    
                    return next;
                }
                return prev;
            });
        }, 80);
        return () => clearInterval(interval);
    }, [phaseIndex, phases]);

    const currentPhase = phases[phaseIndex] || phases[phases.length - 1];

    return (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-200 shadow-xl min-h-[450px] animate-in fade-in duration-500">
            <div className="w-full max-w-lg">
                <div className="flex justify-between items-end mb-5">
                    <div className="space-y-1.5">
                        <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${type === 'trajectory' ? 'text-sky-600' : 'text-emerald-600'}`}>
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${type === 'trajectory' ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${type === 'trajectory' ? 'bg-sky-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            AI Processing: Phase {phaseIndex + 1} / 4
                        </p>
                        <h3 className="font-black text-slate-800 text-xl">{currentPhase.label}</h3>
                    </div>
                    <span className="text-4xl font-black text-slate-200 tabular-nums">{Math.floor(progress)}%</span>
                </div>
                
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner mb-8 relative">
                    <div 
                        className={`h-full transition-all duration-300 ease-out relative ${type === 'trajectory' ? 'bg-gradient-to-r from-sky-400 to-indigo-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>

                <div className={`p-8 rounded-3xl border shadow-sm ${type === 'trajectory' ? 'bg-sky-50/50 border-sky-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <p className={`text-sm font-bold leading-relaxed ${type === 'trajectory' ? 'text-sky-900' : 'text-emerald-900'}`}>
                        {currentPhase.detail}
                    </p>
                    <div className={`flex items-center gap-3 mt-4 pt-4 border-t ${type === 'trajectory' ? 'border-sky-100' : 'border-emerald-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${type === 'trajectory' ? 'bg-sky-400' : 'bg-emerald-400'}`}></div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocol 3.0 Analysis Engine</p>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}} />
        </div>
    );
};

const TrajectoryContent: React.FC<{ data: TrajectoryAnalysisData }> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const colors = { high: 'bg-rose-100 text-rose-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };

    // デモ用多段階評価スコアの算出
    const familyScore = data.demoScores?.family_education ?? 0;
    const welfareScore = data.demoScores?.welfare_protection ?? 0;
    const hasDemoScores = data.demoScores !== undefined;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* レッドフラッグ警告バナー (パターンB・緊急リファー推奨) */}
            {data.redFlag && (
                <div id="demo-redflag-banner" className="bg-rose-600 text-white px-6 py-5 rounded-3xl shadow-xl border border-rose-500 flex items-start gap-4 animate-in slide-in-from-top duration-500">
                    <span className="text-2xl mt-0.5 shrink-0">⚠️</span>
                    <div className="flex-1">
                        <h4 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                            <span>【レッドフラッグ発令】緊急介入・児童福祉リファー推奨（高）</span>
                            <span className="animate-pulse bg-white/20 text-[9px] px-2 py-0.5 rounded border border-white/20 font-mono tracking-widest font-black uppercase">CRITICAL SOS</span>
                        </h4>
                        <p className="text-xs text-rose-100 leading-relaxed font-medium mt-1">
                            身体的暴力（胸ぐらを掴まれ押し倒された）の具体的なエビデンス、および著名人で社会的地位のある親による相談窓口の完全な外部遮断（強固な社会的孤立）を特定。
                            クライアントの絶対的物理安全の即時確保のため、児童相談所や警察機関への直接の専門リファー介入を強く推奨します。
                        </p>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black border tracking-wider uppercase ${colors[data.triageLevel] || colors.low}`}>
                            {data.triageLevel === 'high' ? '要介入' : data.triageLevel === 'medium' ? '経過観察' : '安定'}
                        </span>
                        <h2 className="text-2xl font-black tracking-tight">介入戦略インサイト</h2>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded border border-white/20 font-bold tracking-widest text-sky-300 uppercase">
                            Theory-Based Analysis
                        </span>
                        <span className="text-xs text-slate-400 font-medium">根拠: {data.theoryBasis}</span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">臨床的観点からの「内的変容」分析。</p>
                </div>
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex-shrink-0 w-full sm:w-80">
                    <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-2 flex items-center gap-2"><SparklesIcon className="w-3 h-3"/> Session Starter</p>
                    <p className="text-sm font-bold italic leading-relaxed">「{data.sessionStarter}」</p>
                </div>
            </div>
            
            <div className={`grid grid-cols-1 ${data.typingFluencySpike ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6 items-start`}>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-end mb-4">
                            <div><h3 className="font-bold text-slate-800">Age-Stage Gap (心理的乖離)</h3></div>
                            <span className={`text-3xl font-black ${data.ageStageGap > 60 ? 'text-rose-500' : 'text-emerald-500'}`}>{data.ageStageGap}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${data.ageStageGap > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${data.ageStageGap}%` }}></div>
                        </div>
                    </div>

                    {/* デモ用：対話深度に応じたAI見立ての多段階評価パネル */}
                    {hasDemoScores && (
                        <div id="demo-assessment-scores" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in duration-500">
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                                    data.triageLevel === 'high' 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.1)]' 
                                    : 'bg-amber-50 border-amber-200 text-amber-600'
                                }`}>
                                    {data.triageLevel === 'high' ? 'DEEP ANALYSIS FOCUS' : 'SHALLOW ANALYSIS FOCUS'}
                                </span>
                                <h4 className="font-black text-slate-800 text-sm">見立ての多段階評価スコア</h4>
                            </div>
                            
                            <div className="space-y-4">
                                {/* 教育・家族葛藤領域 */}
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold text-slate-600">教育・家庭衝突領域 (家族論的葛藤)</span>
                                        <span className={`text-xs font-black tracking-tight ${familyScore > 50 ? 'text-indigo-600 font-black' : 'text-slate-400 font-bold'}`}>
                                            {familyScore}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${
                                                familyScore > 50 
                                                ? 'bg-indigo-600' 
                                                : 'bg-slate-300'
                                            }`} 
                                            style={{ width: `${familyScore}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* 福祉・児童保護領域 */}
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold text-slate-600">福祉・児童保護領域 (強制介入・要救済)</span>
                                        <span className={`text-sm font-black tracking-tight ${welfareScore > 50 ? 'text-rose-600 font-black text-base animate-pulse' : 'text-slate-400'}`}>
                                            {welfareScore}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-[1200ms] ${
                                                welfareScore > 50 
                                                ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                                                : 'bg-slate-300'
                                            }`} 
                                            style={{ width: `${welfareScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-[9px] text-slate-400 leading-relaxed font-semibold mt-3">
                                💡 対話データのエビデンス具体性により、AIの見立てが「家庭衝突（教育優先）」から「強制介入（福祉保護）」へと自律的・多段階的に推移しています。
                            </p>
                        </div>
                    )}

                    <div className="border border-indigo-100 rounded-2xl bg-indigo-50/30 overflow-hidden">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 hover:bg-indigo-50/50 transition-colors">
                            <div className="flex items-center gap-2.5"><BrainIcon className="w-4 h-4 text-indigo-600" /><span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">臨床的見立ての詳細（理論背景）</span></div>
                            <ChevronDownIcon className={`w-4 h-4 text-indigo-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                            <div className="px-5 pb-5 space-y-4">
                                <div className="p-4 bg-white/60 rounded-xl border border-indigo-100 shadow-sm">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Applied Psychology Theory</p>
                                    <p className="text-sm text-slate-800 font-bold">{data.theoryBasis}</p>
                                </div>
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

                {/* タイピング揺らぎ・沈黙45秒のスパイク波形グラフ（パターンB用） */}
                {data.typingFluencySpike && (
                    <div id="demo-typing-fluency-graph" className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl text-white space-y-4 animate-in slide-in-from-right duration-750 w-full lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono tracking-widest text-rose-400 bg-rose-950 border border-rose-900 px-2 py-0.5 rounded uppercase font-black">Typing Fluency Spike Detector</span>
                            <span className="text-[8px] font-mono text-slate-600">RESOLUTION: 100ms</span>
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-rose-400">非言語情報：打鍵行動の迷い推定</h4>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold mt-1">
                                対話開始23分付近、10文字のタイピングを開始する前に、通常の10倍を超える【45,280ミリ秒（約45秒）の長期的沈黙スパイク】を観測しました。この長期的なためらいを克服した直後に、身体的虐待に関する極めて重い具体的な告白（「押し倒された」）の表明がなされています。
                            </p>
                        </div>
                        <div className="w-full bg-slate-900 rounded-xl p-3 relative flex flex-col justify-end border border-slate-800 h-32 overflow-hidden">
                            <div className="absolute top-2 left-3 text-[7px] font-mono text-slate-500">打鍵間隔時間 (Duration ms)</div>
                            
                            <div className="absolute inset-x-0 bottom-1/4 border-b border-white/[0.03] border-dashed"></div>
                            <div className="absolute inset-x-0 bottom-2/4 border-b border-white/[0.03] border-dashed"></div>
                            <div className="absolute inset-x-0 bottom-3/4 border-b border-white/[0.03] border-dashed"></div>

                            <svg className="w-full h-20" viewBox="0 0 300 100" preserveAspectRatio="none">
                                <path
                                    d="M 0,90 C 20,85 45,88 65,85 C 85,86 110,88 135,84 C 145,86 150,40 152,10 C 154,80 160,85 180,85 C 200,89 220,86 245,85 C 270,88 285,84 300,85"
                                    fill="none"
                                    stroke="rgba(244, 63, 94, 0.3)"
                                    strokeWidth="4"
                                    className="animate-pulse"
                                />
                                <path
                                    d="M 0,90 C 20,85 45,88 65,85 C 85,86 110,88 135,84 C 145,86 150,40 152,10 C 154,80 160,85 180,85 C 200,89 220,86 245,85 C 270,88 285,84 300,85"
                                    fill="none"
                                    stroke="#f43f5e"
                                    strokeWidth="1.5"
                                />
                                <circle cx="152" cy="10" r="4.5" fill="#f43f5e" className="animate-ping" />
                                <circle cx="152" cy="10" r="2.5" fill="#ffffff" />
                            </svg>
                            
                            <span className="absolute top-10 left-[165px] bg-rose-600 text-[8px] font-semibold text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-pulse">
                                45.2s 沈黙スパイク (迷い係数: 9.8)
                            </span>
                            
                            <div className="flex justify-between text-[6px] font-mono text-slate-500 mt-1.5">
                                <span>20分</span>
                                <span>21分</span>
                                <span>23分 (沈黙)</span>
                                <span>25分</span>
                                <span>28分</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6"><TrajectoryIcon className="w-5 h-5 text-indigo-600"/><h3 className="font-bold text-slate-800 text-xl tracking-tight">内の実体験報告サマリー</h3></div>
                <div className="prose prose-slate max-w-none text-slate-700" dangerouslySetInnerHTML={createMarkup(data.overallSummary)} />
            </section>
        </div>
    );
};

const SkillMatchingContent: React.FC<{ data: SkillMatchingResult }> = ({ data }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6"><TargetIcon className="w-5 h-5 text-emerald-600" /><h3 className="text-xl font-extrabold text-emerald-900 tracking-tight">適職診断・市場価値レポート</h3></div>
                <article className="prose prose-emerald max-w-none prose-p:text-emerald-800 z-10 relative" dangerouslySetInnerHTML={createMarkup(data.analysisSummary)} />
            </section>

            {/* Consultant Guideline Chip */}
            <div className="bg-sky-50 border border-sky-100 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-start">
                <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-md flex-shrink-0">
                    <ClipboardIcon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-sky-900 font-black text-sm uppercase tracking-widest mb-2">Consultant Guidance</h4>
                    <p className="text-sky-800 text-sm font-bold leading-relaxed">
                        本提案は「現在の経験をどう活かすか」に焦点を当てた現実的なステップです。
                        相談者には「今の経験がこれほど高く評価できる」というポジティブな側面を強調しつつ、
                        提示されたマッチスコアの背景にある「スキルギャップ」を誠実に伝えることで、納得感のある行動変容を促してください。
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5"><BriefcaseIcon className="w-5 h-5 text-sky-600" /><h3 className="font-bold text-slate-800">推奨ロールと適合根拠</h3></div>
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
    // Determine which loader to show based on loading state
    if (trajectoryState?.status === 'loading') return <ProgressiveAnalysisLoader type="trajectory" />;
    if (skillMatchingState?.status === 'loading') return <ProgressiveAnalysisLoader type="skillMatching" />;

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
