
// views/ReferralView.tsx - v1.00 - Professional Referral UI
import React from 'react';
import SparklesIcon from '../components/icons/SparklesIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import ChatIcon from '../components/icons/ChatIcon';
import TrendingUpIcon from '../components/icons/TrendingUpIcon';

interface ReferralViewProps {
  onBack: () => void;
}

const ReferralView: React.FC<ReferralViewProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-6 h-full overflow-y-auto animate-in fade-in duration-700">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden w-full max-w-2xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <TrendingUpIcon className="w-32 h-32" />
        </div>
        
        <div className="p-10 md:p-14 text-center">
            <div className="flex justify-center mb-8">
                <div className="relative">
                    <div className="w-24 h-24 bg-sky-500 rounded-full flex items-center justify-center shadow-2xl shadow-sky-200 z-10 relative">
                        <ChatIcon className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                    AIとの対話で、<br/>
                    あなたの「一歩」が見えてきました。
                </h2>
                
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                    <p className="text-slate-700 font-bold leading-relaxed mb-4">
                        AIで言葉にできなかった「行間」や「心の奥底にある本当の悩み」は、国家資格を持つ専門家（キャリアコンサルタント）がしっかり受け止めます。
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                            感情の微細なニュアンスを共有し、共感を得る
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                            より具体的で、あなたに最適化された戦略の構築
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-500"></div>
                            孤独なキャリア形成に、心強い伴走者を
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <a 
                        href="https://careerconsultant.mhlw.go.jp/search/Matching/Search" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-3 py-5 bg-sky-600 text-white font-black rounded-2xl shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all active:scale-[0.98] text-lg"
                    >
                        <BriefcaseIcon className="w-6 h-6" />
                        国家資格保持者を探す
                    </a>
                    
                    <button 
                        onClick={onBack}
                        className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase tracking-widest text-xs"
                    >
                        ダッシュボードへ戻る
                    </button>
                </div>
            </div>
        </div>
        
        <footer className="bg-slate-50 p-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">
                National Career Consultant Referral Protocol v1.0<br/>
                Empowering Human Connection
            </p>
        </footer>
      </div>
      
      <div className="mt-12 text-slate-300 text-xs font-bold uppercase tracking-[0.3em] animate-pulse text-center max-w-xs">
          Your journey continues beyond digital limits
      </div>
    </div>
  );
};

export default ReferralView;
