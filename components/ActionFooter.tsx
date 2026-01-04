
import React from 'react';

interface ActionFooterProps {
  isReady: boolean;
  onSummarize: () => void;
  onInterrupt: () => void;
}

const ActionFooter: React.FC<ActionFooterProps> = ({ isReady, onSummarize, onInterrupt }) => {
  return (
    <div className="p-3 border-t border-slate-100 bg-slate-50/50">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
        <button
          onClick={onInterrupt}
          className="w-full px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-300 transition-all duration-200 active:scale-95"
        >
          相談を中断する
        </button>
        <button
          onClick={onSummarize}
          disabled={!isReady}
          className={`w-full px-4 py-2 font-bold rounded-xl shadow-md transition-all duration-300 active:scale-95 ${
            isReady 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600 ring-2 ring-emerald-300 ring-offset-2' 
              : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
          }`}
        >
          {isReady ? '相談を完了して要約する' : '要約は2往復以上の対話で可能'}
        </button>
      </div>
    </div>
  );
};

export default ActionFooter;
