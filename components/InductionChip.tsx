
// components/InductionChip.tsx - v1.10 - Double Action UI
import React from 'react';
import SparklesIcon from './icons/SparklesIcon';
import ChatIcon from './icons/ChatIcon';

interface InductionChipProps {
  isVisible: boolean;
  onSummarize: () => void;
  onDeepDive: () => void;
}

const InductionChip: React.FC<InductionChipProps> = ({ isVisible, onSummarize, onDeepDive }) => {
  if (!isVisible) return null;

  return (
    <div className="w-full px-4 pt-2 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-xl p-1.5 flex flex-col sm:flex-row gap-1.5">
          {/* Finish & Summarize Action */}
          <button
            onClick={onSummarize}
            className="flex-1 relative group overflow-hidden bg-emerald-500 rounded-xl p-3 hover:bg-emerald-600 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg text-white">
                    <SparklesIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-black text-emerald-50 uppercase tracking-widest leading-none mb-1">Session Complete</p>
                    <p className="text-xs font-black text-white">内容を要約して整理する</p>
                </div>
            </div>
          </button>

          {/* Deep Dive Action */}
          <button
            onClick={onDeepDive}
            className="flex-1 group bg-slate-50 rounded-xl p-3 border border-slate-200 hover:bg-sky-50 hover:border-sky-200 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 text-slate-600 group-hover:text-sky-700">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    <ChatIcon className="w-4 h-4" />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 group-hover:text-sky-400 uppercase tracking-widest leading-none mb-1">Deep Dive Mode</p>
                    <p className="text-xs font-black">まだ話し足りない（深掘り）</p>
                </div>
            </div>
          </button>
      </div>
      
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            AI is ready to summarize or explore further with you
        </p>
      </div>
    </div>
  );
};

export default InductionChip;