
import React, { useState } from 'react';
import SummarizeIcon from './icons/SummarizeIcon';
import InterruptIcon from './icons/InterruptIcon';
import PlusIcon from './icons/PlusIcon';

interface FloatingActionButtonProps {
  isReady: boolean;
  onSummarize: () => void;
  onInterrupt: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ isReady, onSummarize, onInterrupt }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-24 right-4 z-30 flex flex-col items-end gap-3">
      {/* Action Buttons */}
      <div 
        className={`transition-all duration-300 ease-in-out flex flex-col items-end gap-3 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Interrupt Button */}
        <div className="flex items-center gap-3">
          <span className="bg-white/95 text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm">
            相談を中断する
          </span>
          <button
            onClick={() => { onInterrupt(); setIsOpen(false); }}
            className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shadow-lg hover:bg-slate-300 transition-colors"
            aria-label="相談を中断する"
          >
            <InterruptIcon />
          </button>
        </div>

        {/* Summarize Button */}
        <div className="flex items-center gap-3">
          <span className={`bg-white/95 text-sm font-semibold px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm ${!isReady ? 'text-slate-400' : 'text-slate-700'}`}>
            相談を終了して整理する
          </span>
          <button
            onClick={() => { if (isReady) { onSummarize(); setIsOpen(false); } }}
            disabled={!isReady}
            className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            aria-label="相談を終了して整理する"
          >
            <SummarizeIcon />
          </button>
        </div>
      </div>

      {/* Main FAB Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xl hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}
        aria-expanded={isOpen}
        aria-label="アクションメニューを開く"
      >
        <PlusIcon />
      </button>
    </div>
  );
};

export default FloatingActionButton;
