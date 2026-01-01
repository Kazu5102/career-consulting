

import React from 'react';
import { marked } from 'marked';
import { AnalysisData, ChartDataPoint, ConsultationEntry, TrajectoryAnalysisData, SkillToDevelop, HiddenPotentialData, AnalysisStateItem } from '../types';
import DoughnutChart from './charts/DoughnutChart';
import BarChartIcon from './icons/BarChartIcon';
import PieChartIcon from './icons/PieChartIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import ChatIcon from './icons/ChatIcon';
import EditIcon from './icons/EditIcon';
import CheckIcon from './icons/CheckIcon';
import CalendarIcon from './icons/CalendarIcon';
import BrainIcon from './icons/BrainIcon';
import SparklesIcon from './icons/SparklesIcon';
import TrajectoryIcon from './icons/TrajectoryIcon';


interface AnalysisDisplayProps {
    comprehensiveState?: AnalysisStateItem<AnalysisData>;
    trajectoryState?: AnalysisStateItem<TrajectoryAnalysisData>;
    hiddenPotentialState?: AnalysisStateItem<HiddenPotentialData>;
}

const chartColors = [ '#0ea5e9', '#34d399', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1' ];

const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '' };
    return { __html: marked.parse(markdownText, { breaks: true, gfm: true }) as string };
};

// --- Data Validation Helpers ---
const isValidString = (val: any): val is string => typeof val === 'string' && val.length > 0;
const isValidNumber = (val: any): val is number => typeof val === 'number';
const isValidStringArray = (arr: any): arr is string[] => Array.isArray(arr) && arr.every(item => typeof item === 'string');
const isObject = (val: any): val is object => typeof val === 'object' && val !== null;

// --- Reusable Card Components (with enhanced type safety) ---
const KeyTakeawaysCard: React.FC<{ takeaways: string[] | undefined | null }> = ({ takeaways }) => {
    const safeTakeaways = isValidStringArray(takeaways) ? takeaways : [];
    if (safeTakeaways.length === 0) return null;
    return (
        <div className="bg-sky-50 p-4 rounded-xl shadow-md border border-sky-200">
            <div className="flex items-center gap-3 mb-3">
                <div className="bg-sky-100 text-sky-600 p-2 rounded-lg"><SparklesIcon /></div>
                <h3 className="text-md font-bold text-slate-800">分析ハイライト</h3>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-700 text-sm">
                {safeTakeaways.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};


const MetricCard: React.FC<{ title: string; value: string | number | undefined; icon: React.ReactNode; subValue?: string[] }> = ({ title, value, icon, subValue }) => (
    <div className="bg-white p-4 rounded-xl shadow-md flex items-start gap-4">
        <div className="bg-sky-100 text-sky-600 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value ?? 'N/A'}</p>
            {isValidStringArray(subValue) && (
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1">
                    {subValue.map((item, index) => <span key={index} className="bg-slate-100 px-2 py-0.5 rounded-full">{item}</span>)}
                </div>
            )}
        </div>
    </div>
);

const ChartSection: React.FC<{ title: string; data: ChartDataPoint[] | undefined | null; icon: React.ReactNode }> = ({ title, data, icon }) => {
    // FIX: Removed `isObject` which caused incorrect type narrowing. `d && ...` is safer.
    const chartData = (Array.isArray(data) ? data : [])
        .filter(d => d && isValidString(d.label) && isValidNumber(d.value));
        
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-4"><div className="text-slate-500">{icon}</div><h3 className="text-lg font-bold text-slate-800">{title}</h3></div>
            {chartData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="relative h-48 w-48 mx-auto"><DoughnutChart labels={chartData.map(d => d.label)} data={chartData.map(d => d.value)} colors={chartColors} /></div>
                    <ul className="space-y-2 text-sm">{chartData.map((item, index) => <li key={item.label} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors[index % chartColors.length] }}></span><span className="text-slate-600">{item.label}</span></div><span className="font-semibold text-slate-800">{item.value.toFixed(1)}%</span></li>)}</ul>
                </div>
            ) : (
                <p className="text-sm text-slate-500">チャートデータを生成できませんでした。</p>
            )}
        </div>
    );
};

const InfoListCard: React.FC<{ title: string; items: string[] | undefined | null; icon: React.ReactNode; iconBgColor: string, iconColor: string }> = ({ title, items, icon, iconBgColor, iconColor }) => {
    const safeItems = isValidStringArray(items) ? items : [];
    return (
     <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-3"><div className={`p-2 rounded-lg ${iconBgColor} ${iconColor}`}>{icon}</div><h3 className="text-md font-bold text-slate-800">{title}</h3></div>
        <div className="flex flex-wrap gap-1.5">
            {safeItems.length > 0 ? safeItems.map(item => <span key={item} className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-full">{item}</span>)
             : <p className="text-sm text-slate-500">該当する項目はありませんでした。</p>}
        </div>
    </div>
    );
};

const ConsultationList: React.FC<{consultations: ConsultationEntry[] | undefined | null}> = ({consultations}) => {
    // FIX: Removed `isObject` which caused incorrect type narrowing. `c && ...` is safer.
    const safeConsultations = (Array.isArray(consultations) ? consultations : [])
        .filter(c => c && isValidString(c.dateTime) && isValidNumber(c.estimatedDurationMinutes));
        
    return (
    <div className="bg-white p-4 rounded-xl shadow-md"><div className="flex items-center gap-3 mb-3"><div className="text-slate-500"><CalendarIcon /></div><h3 className="text-md font-bold text-slate-800">相談期間</h3></div><ul className="space-y-1.5 max-h-40 overflow-y-auto pr-2">{safeConsultations.map((c, index) => <li key={index} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-md"><div className="flex items-center gap-2"><span className="font-semibold text-slate-800">{c.dateTime}</span></div><span className="text-slate-600 font-medium">約{c.estimatedDurationMinutes}分</span></li>)}{safeConsultations.length === 0 && <p className="text-sm text-slate-500">相談履歴の詳細データがありません。</p>}</ul></div>
    );
};

const AnalysisErrorDisplay: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
        <h3 className="font-bold text-md flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {title} 分析エラー
        </h3>
        <p className="text-sm mt-2">{message}</p>
    </div>
);

const SectionLoading: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-4 bg-white rounded-xl shadow-md flex items-center gap-4 text-slate-600">
    <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="font-semibold">{title}を分析中...</span>
  </div>
);


// --- Section Components for Individual Analysis ---
const TrajectorySection: React.FC<{ state: AnalysisStateItem<TrajectoryAnalysisData> }> = ({ state }) => {
    if (state.status === 'idle') return null;
    if (state.status === 'loading') return <SectionLoading title="相談の軌跡" />;
    if (state.status === 'error' && state.error) {
        return <AnalysisErrorDisplay title="相談の軌跡" message={state.error} />;
    }
    
    const data = state.data;
    if (!data) return null;
    
    return <section className="space-y-4">
        <div className="flex items-center gap-3">
            <div className="bg-sky-100 text-sky-600 p-2 rounded-lg"><TrajectoryIcon /></div>
            <h2 className="text-xl font-bold text-slate-800">相談の軌跡</h2>
        </div>
        <KeyTakeawaysCard takeaways={data?.keyTakeaways} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard title="相談件数" value={data?.totalConsultations} icon={<BarChartIcon />} />
            <ConsultationList consultations={data?.consultations} />
        </div>
        <InfoListCard title="キーテーマ" items={data?.keyThemes} icon={<ChatIcon />} iconBgColor="bg-sky-100" iconColor="text-sky-600" />
        <InfoListCard title="検出された強み" items={data?.detectedStrengths} icon={<TrendingUpIcon />} iconBgColor="bg-emerald-100" iconColor="text-emerald-600" />
        <InfoListCard title="今後の成長領域" items={data?.areasForDevelopment} icon={<EditIcon />} iconBgColor="bg-amber-100" iconColor="text-amber-600" />
        <InfoListCard title="提案される次のステップ" items={data?.suggestedNextSteps} icon={<CheckIcon />} iconBgColor="bg-violet-100" iconColor="text-violet-600" />
        <div className="bg-white p-4 rounded-xl shadow-md"><h3 className="text-md font-bold text-slate-800 mb-2">総合サマリー</h3><article className="prose prose-sm prose-slate max-w-none" dangerouslySetInnerHTML={createMarkup(data?.overallSummary)} /></div>
    </section>;
};


const HiddenPotentialSection: React.FC<{ state: AnalysisStateItem<HiddenPotentialData> }> = ({ state }) => {
    if (state.status === 'idle') return null;
    if (state.status === 'loading') return <SectionLoading title="隠れた可能性" />;
    if (state.status === 'error' && state.error) {
        return <AnalysisErrorDisplay title="隠れた可能性" message={state.error} />;
    }

    const data = state.data;
    if (!data) return null;
    
    // FIX: Removed `isObject` which caused incorrect type narrowing. `!!(s && ...)` is safer for the type guard.
    const hiddenSkills = (Array.isArray(data?.hiddenSkills) ? data.hiddenSkills : [])
        .filter((s): s is SkillToDevelop => !!(s && isValidString(s.skill) && isValidString(s.reason)));

    if (hiddenSkills.length === 0) return null;

    return <section className="bg-amber-50 border-2 border-dashed border-amber-300 p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-lg"><BrainIcon /></div>
            <h2 className="text-xl font-bold text-amber-800">コンサルタント向け: 隠れた可能性</h2>
        </div>
        <p className="text-sm text-amber-700 mb-3">クライアント本人も気づいていない、または言語化できていない潜在的な強みです。</p>
        <div className="space-y-2">{hiddenSkills.map(skill => <div key={skill.skill} className="bg-white/70 p-3 rounded-lg"><h4 className="font-semibold text-amber-900 text-sm">{skill.skill}</h4><p className="text-xs text-slate-600">{skill.reason}</p></div>)}</div>
    </section>;
};

// --- Main Component ---
const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ comprehensiveState, trajectoryState, hiddenPotentialState }) => {
    
    // Comprehensive Analysis View
    if (comprehensiveState) {
        const { status, data, error } = comprehensiveState;

        if (status === 'loading') {
             return (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center">
                  <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="font-semibold">総合分析を実行中...</p>
              </div>
            );
        }
        if (status === 'error' && error) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-center text-red-500 bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">分析エラー</h3>
                  <p className="mt-1">{error}</p>
              </div>
            );
        }
        if (status === 'success' && data) {
            const keyMetrics = data.keyMetrics;
            return (
                <div className="space-y-6">
                     <KeyTakeawaysCard takeaways={data.keyTakeaways} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricCard title="総相談件数" value={keyMetrics?.totalConsultations} icon={<BarChartIcon />} />
                        <MetricCard title="主な業界" value={(isValidStringArray(keyMetrics?.commonIndustries) && keyMetrics.commonIndustries.length > 0) ? keyMetrics.commonIndustries[0] : 'N/A'} subValue={keyMetrics?.commonIndustries} icon={<TrendingUpIcon />} />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <ChartSection title="共通の悩み・課題" data={data.commonChallenges} icon={<PieChartIcon />} />
                        <ChartSection title="キャリアにおける希望" data={data.careerAspirations} icon={<PieChartIcon />} />
                    </div>
                    <InfoListCard title="相談者によく見られる強み" items={data.commonStrengths} icon={<CheckIcon />} iconBgColor="bg-emerald-100" iconColor="text-emerald-600" />
                    <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-lg font-bold text-slate-800 mb-4">総合的なインサイトと提言</h3><article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={createMarkup(data.overallInsights)} /></div>
                </div>
            );
        }

        // Fallback for idle or other states
        return null;
    }

    // Individual Analysis View
    if (trajectoryState && hiddenPotentialState) {
        const isInitial = trajectoryState.status === 'idle' && hiddenPotentialState.status === 'idle';

        if(isInitial) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center">
                    <h3 className="font-semibold">分析レポート</h3>
                    <p className="text-sm mt-1">ボタンをクリックして、AI分析を開始してください。</p>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                <TrajectorySection state={trajectoryState} />
                <HiddenPotentialSection state={hiddenPotentialState} />
            </div>
        );
    }
    
    return null;
};

export default AnalysisDisplay;