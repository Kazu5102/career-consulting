
// views/ExpertMatchingView.tsx - v1.00 - Expert Matching Simulator
import React, { useState, useEffect } from 'react';
import SparklesIcon from '../components/icons/SparklesIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import CheckIcon from '../components/icons/CheckIcon';
import TrajectoryIcon from '../components/icons/TrajectoryIcon';

interface ExpertProfile {
    id: string;
    name: string;
    title: string;
    experience: string;
    tags: string[];
    matchScore: number;
    description: string;
    avatarBg: string;
}

const DUMMY_EXPERTS: ExpertProfile[] = [
    {
        id: 'ex_1',
        name: '佐藤 健一',
        title: 'IT/テック業界 専門キャリアコンサルタント',
        experience: '業界経験15年 / 1,000人以上のエンジニア支援',
        tags: ['#エンジニア転職', '#キャリアチェンジ', '#スキルアップ戦略'],
        matchScore: 98,
        description: 'あなたの「技術への好奇心」と「現実的なキャリアパス」を繋ぐ対話を得意としています。無理のない成長ステップを一緒に描きましょう。',
        avatarBg: 'bg-sky-500'
    },
    {
        id: 'ex_2',
        name: '田中 麻衣',
        title: 'ライフステージ・バランス アドバイザー',
        experience: '国家資格キャリアコンサルタント / 産業カウンセラー',
        tags: ['#ワークライフバランス', '#育児両立', '#メンタルケア重視'],
        matchScore: 94,
        description: '仕事だけでなく、人生全体のバランスを大切にするあなたの想いに寄り添います。心のモヤモヤを整理し、自分らしい働き方を見つけましょう。',
        avatarBg: 'bg-emerald-500'
    },
    {
        id: 'ex_3',
        name: '高橋 浩二',
        title: 'エグゼクティブ・リーダーシップ コーチ',
        experience: '外資系人事20年 / 経営層向けコーチング多数',
        tags: ['#マネジメント', '#リーダーシップ開発', '#長期ビジョン構築'],
        matchScore: 89,
        description: 'チームでの成果や大きな目標に挑戦したいというあなたのポテンシャルを最大限に引き出します。一段上の視座でキャリアを再定義しましょう。',
        avatarBg: 'bg-indigo-600'
    }
];

interface ExpertMatchingViewProps {
    onBack: () => void;
}

const ExpertMatchingView: React.FC<ExpertMatchingViewProps> = ({ onBack }) => {
    const [step, setStep] = useState<'analyzing' | 'results'>('analyzing');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (step === 'analyzing') {
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        setTimeout(() => setStep('results'), 500);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 60);
            return () => clearInterval(timer);
        }
    }, [step]);

    if (step === 'analyzing') {
        return (
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 h-full animate-in fade-in duration-500">
                <div className="relative w-32 h-32 mb-12">
                    <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-8 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TrajectoryIcon className="w-12 h-12 text-sky-500 animate-pulse" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-black text-slate-800 text-center mb-4">
                    AIが最適な専門家を<br/>マッチングしています...
                </h2>
                
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner mb-6">
                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="space-y-3 text-center">
                    <p className="text-sm font-bold text-slate-500 animate-pulse">
                        {progress < 40 ? '対話ログの深層解析を実行中...' : 
                         progress < 70 ? 'あなたの「真の課題」に合う専門性を抽出中...' : 
                         '35,000人以上のコンサルタントデータベースと照合中...'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Protocol 2.0 Matching Algorithm Active</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6 overflow-y-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-sm">
                    <CheckIcon className="w-3 h-3" /> Matching Completed
                </div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">あなたに推奨される専門家</h1>
                <p className="mt-2 text-slate-500 font-bold">対話結果に基づき、特に相性の良いコンサルタントを抽出しました。</p>
            </header>

            <div className="grid grid-cols-1 gap-6 mb-12">
                {DUMMY_EXPERTS.map((expert, idx) => (
                    <div key={expert.id} 
                         className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden hover:border-sky-300 transition-all group active:scale-[0.99]"
                         style={{ animation: `popIn 0.5s ease-out forwards ${idx * 0.1}s`, opacity: 0 }}
                    >
                        <div className="flex flex-col md:flex-row">
                            <div className={`md:w-48 ${expert.avatarBg} flex items-center justify-center p-8 text-white relative`}>
                                <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter">
                                    Top Match
                                </div>
                                <div className="text-6xl font-black opacity-40 select-none">{expert.name[0]}</div>
                            </div>
                            <div className="flex-1 p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">{expert.name}</h3>
                                        <p className="text-sm font-bold text-sky-600 mt-1">{expert.title}</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{expert.experience}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Match</p>
                                        <p className="text-3xl font-black text-sky-500">{expert.matchScore}%</p>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                                    {expert.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {expert.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-tighter border border-slate-200 group-hover:bg-sky-50 group-hover:text-sky-600 group-hover:border-sky-200 transition-colors">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:bg-sky-600 transition-all transform hover:translate-y-[-2px] uppercase tracking-widest text-xs">
                                    この専門家の詳細を見る（デモ）
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-amber-50 rounded-3xl border border-amber-100 p-8 text-center space-y-4 mb-10">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                        <SparklesIcon className="w-6 h-6" />
                    </div>
                </div>
                <h4 className="text-lg font-black text-amber-900">これはシミュレーション画面です</h4>
                <p className="text-sm text-amber-800 font-bold leading-relaxed max-w-lg mx-auto">
                    本番環境では、実在するキャリアコンサルタントのデータベースから、AIが最適なパートナーを推奨し、そのままオンライン面談の予約が可能になる予定です。
                </p>
                <button 
                    onClick={onBack}
                    className="px-8 py-3 bg-white border border-amber-200 text-amber-700 font-black rounded-2xl shadow-sm hover:bg-amber-100 transition-all text-sm"
                >
                    ダッシュボードへ戻る
                </button>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes popIn {
                    0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}} />
        </div>
    );
};

export default ExpertMatchingView;