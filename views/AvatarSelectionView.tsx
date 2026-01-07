
// views/AvatarSelectionView.tsx - v2.96 - 1-vs-1 Comparison Selection UI
import React, { useMemo } from 'react';
import { AIType } from '../types';
import { ASSISTANTS } from '../config/aiAssistants';

interface AvatarSelection {
    type: AIType;
    avatarKey: string;
}

interface AvatarSelectionViewProps {
  onSelect: (selection: AvatarSelection) => void;
}

const AvatarSelectionView: React.FC<AvatarSelectionViewProps> = ({ onSelect }) => {
  const selectedAssistants = useMemo(() => {
    // それぞれのカテゴリからランダムに1名のみを抽出
    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
    
    const human = shuffle(ASSISTANTS.filter(a => a.type === 'human'))[0];
    const dog = shuffle(ASSISTANTS.filter(a => a.type === 'dog'))[0];
    
    return { human, dog };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-6 py-8 md:py-16">
      <div className="text-center mb-10 md:mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-sm">
           Consultation Partner
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight">対話のパートナーを1名選んでください</h1>
        <p className="mt-4 text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
          今日の気分に合わせて、プロフェッショナルな「人間」か、癒やしの「わんこ」かをお選びいただけます。
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full items-stretch justify-center">
        {/* Human Partner */}
        <button 
          onClick={() => onSelect({ type: 'human', avatarKey: selectedAssistants.human.id })}
          className="flex-1 group flex flex-col items-center bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-sky-200 focus:outline-none focus:ring-4 focus:ring-sky-100 text-left animate-in fade-in slide-in-from-left-4 duration-700"
        >
          <div className="w-48 h-48 md:w-56 md:h-56 mb-8 rounded-full overflow-hidden bg-slate-50 border-8 border-slate-50 group-hover:border-sky-50 transition-all relative shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 to-transparent"></div>
            <div className="w-full h-full transform scale-110 group-hover:scale-125 transition-transform duration-700">
              {selectedAssistants.human.avatarComponent}
            </div>
          </div>
          <div className="w-full space-y-4 text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full group-hover:bg-sky-500 group-hover:text-white transition-all">Professional Agent</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-sky-700 transition-colors">{selectedAssistants.human.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed min-h-[3rem]">{selectedAssistants.human.description}</p>
          </div>
          <div className="mt-10 w-full px-8 py-4 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-lg group-hover:bg-sky-600 group-hover:translate-y-[-4px] transition-all text-center">
            このパートナーと相談
          </div>
        </button>

        <div className="flex items-center justify-center py-4">
            <span className="text-slate-300 font-black text-xl italic">OR</span>
        </div>

        {/* Dog Partner */}
        <button 
          onClick={() => onSelect({ type: 'dog', avatarKey: selectedAssistants.dog.id })}
          className="flex-1 group flex flex-col items-center bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-100 text-left animate-in fade-in slide-in-from-right-4 duration-700"
        >
          <div className="w-48 h-48 md:w-56 md:h-56 mb-8 rounded-full overflow-hidden bg-amber-50 border-8 border-amber-50 group-hover:border-amber-100 transition-all relative shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent"></div>
            <div className="w-full h-full transform scale-110 group-hover:scale-125 transition-transform duration-700">
              {selectedAssistants.dog.avatarComponent}
            </div>
          </div>
          <div className="w-full space-y-4 text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full group-hover:bg-amber-500 group-hover:text-white transition-all">Supportive Animal</span>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-amber-700 transition-colors">{selectedAssistants.dog.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed min-h-[3rem]">{selectedAssistants.dog.description}</p>
          </div>
          <div className="mt-10 w-full px-8 py-4 bg-slate-900 text-white font-black text-lg rounded-2xl shadow-lg group-hover:bg-amber-600 group-hover:translate-y-[-4px] transition-all text-center">
             このパートナーと相談
          </div>
        </button>
      </div>

      <div className="mt-16 text-slate-300 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
         Discover your next step with empathy
      </div>
    </div>
  );
};

export default AvatarSelectionView;
