
import React from 'react';
import InterruptIcon from './icons/InterruptIcon';
import SummarizeIcon from './icons/SummarizeIcon';

interface ActionFooterProps {
  isReady: boolean;
  onSummarize: () => void;
  onInterrupt: () => void;
}

const ActionFooter: React.FC<ActionFooterProps> = ({ isReady, onSummarize, onInterrupt }) => {
  return (
    <div className="p-3 border-t border-slate-100 bg-slate-50/50">
      <div className="max-w-3xl mx-auto flex gap-3">
        <button
          onClick={onInterrupt}
          className="flex-1 flex flex-col items-center justify-center py-2.5 px-2 bg-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-300 transition-all duration-200 active:scale-95 border border-slate-300/50"
        >
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <InterruptIcon className="w-4 h-4" />
            一時保存して中断
          </span>
          <span className="text-[10px] opacity-70 font-normal mt-0.5">後で再開できます</span>
        </button>
        
        <button
          onClick={onSummarize}
          disabled={!isReady}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 px-2 rounded-xl shadow-md transition-all duration-300 active:scale-95 border ${
            isReady 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-600 ring-2 ring-emerald-100' 
              : 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-300 opacity-70'
          }`}
        >
          <span className="flex items-center gap-1.5 text-sm font-bold">
            <SummarizeIcon className="w-4 h-4" />
            {isReady ? '相談を終了して整理する' : '要約の準備中'}
          </span>
          <span className="text-[10px] opacity-80 font-normal mt-0.5">
            {isReady ? '振り返りシートを作成' : '対話が2往復以上で可能'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ActionFooter;
