import React from 'react';

interface ActionFooterProps {
  isReady: boolean;
  onSummarize: () => void;
  onInterrupt: () => void;
}

const ActionFooter: React.FC<ActionFooterProps> = ({ isReady, onSummarize, onInterrupt }) => {
  return (
    <div className="p-3 border-t border-slate-100">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
        <button
          onClick={onInterrupt}
          className="w-full px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-300 transition-all duration-200"
        >
          相談を中断する
        </button>
        <button
          onClick={onSummarize}
          disabled={!isReady}
          className="w-full px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isReady ? '相談内容を要約する' : '要約は対話が2往復以上で可能'}
        </button>
      </div>
    </div>
  );
};

export default ActionFooter;