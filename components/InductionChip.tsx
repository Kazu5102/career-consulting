
// components/InductionChip.tsx - v1.00 - Smart Induction UI
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';

interface InductionChipProps {
  isVisible: boolean;
  onSummarize: () => void;
}

const InductionChip: React.FC<InductionChipProps> = ({ isVisible, onSummarize }) => {
  if (!isVisible) return null;

  return (
    <div className="w-full px-4 pt-2 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button
        onClick={onSummarize}
        className="w-full relative group overflow-hidden bg-emerald-500 rounded-2xl p-4 shadow-xl shadow-emerald-200/50 hover:bg-emerald-600 transition-all duration-300 active:scale-[0.98] border-2 border-emerald-400"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl text-white animate-pulse">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <p className="text-xs font-black text-emerald-50 uppercase tracking-widest mb-0.5">Recommended Next Step</p>
                    <p className="text-sm font-black text-white">ここまでの対話を要約して整理する</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80 group-hover:opacity-100">Start Summary</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" />
                </svg>
            </div>
        </div>
      </button>
      
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
            AI has determined enough information is gathered
        </p>
      </div>
    </div>
  );
};

export default InductionChip;