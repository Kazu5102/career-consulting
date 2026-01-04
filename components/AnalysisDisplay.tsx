
import React from 'react';
import { marked } from 'marked';
import { TrajectoryAnalysisData, AnalysisStateItem, ReframedSkill } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import TrajectoryIcon from './icons/TrajectoryIcon';
import TargetIcon from './icons/TargetIcon';

interface AnalysisDisplayProps {
    trajectoryState?: AnalysisStateItem<TrajectoryAnalysisData>;
}

const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '' };
    return { __html: marked.parse(markdownText, { breaks: true, gfm: true }) as string };
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

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ trajectoryState }) => {
    if (!trajectoryState || trajectoryState.status === 'idle') return null;
    const { status, data, error } = trajectoryState;

    if (status === 'loading') return (
        <div className="p-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-slate-600">AIが深層心理の軌跡を分析中...</p>
        </div>
    );

    if (status === 'error') return (
        <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-bold">
            分析エラー: {error}
        </div>
    );

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Expert Triage Header */}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GapChart gap={data.ageStageGap} />
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-sky-100 text-sky-600 p-2 rounded-xl"><TrajectoryIcon className="w-5 h-5"/></div>
                        <h3 className="font-bold text-slate-800">主要な臨床的指摘</h3>
                    </div>
                    <ul className="space-y-3">
                        {data.keyTakeaways.map((t, i) => (
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
};

export default AnalysisDisplay;
