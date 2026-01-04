
import React from 'react';
import LightbulbIcon from './icons/LightbulbIcon';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isInputActive?: boolean; // 入力中かどうかのフラグ
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSuggestionClick, isInputActive }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`w-full px-4 pt-2 pb-1 transition-all duration-500 ease-in-out ${
      isInputActive 
        ? 'opacity-20 scale-[0.98] pointer-events-none blur-[0.5px]' 
        : 'opacity-100 scale-100 pointer-events-auto'
    }`}>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <div className="text-sky-500">
          <LightbulbIcon className="w-4 h-4" />
        </div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          次の対話のヒント
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left p-3 bg-white/80 backdrop-blur-sm border border-sky-100 rounded-xl shadow-sm hover:bg-sky-50 hover:border-sky-300 hover:shadow-md transition-all duration-200 group active:scale-[0.98]"
            style={{ 
              animation: 'slideUp 0.5s ease-out forwards',
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-sky-400 group-hover:text-sky-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </span>
              <span className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                {suggestion}
              </span>
            </div>
          </button>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default SuggestionChips;
