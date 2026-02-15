
// components/SuggestionChips.tsx - v2.24 - Mobile Optimized UX
import React from 'react';
import LightbulbIcon from './icons/LightbulbIcon';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isVisible?: boolean; 
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSuggestionClick, isVisible }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`w-full px-4 pt-2 pb-2 transition-all duration-500 ease-out ${
      isVisible 
        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
        : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
    }`}>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <div className="text-sky-500 animate-pulse">
          <LightbulbIcon className="w-4 h-4" />
        </div>
        <p className="text-[11px] font-black text-sky-600 uppercase tracking-widest">
          NEXT STEP HINT
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left p-4 bg-white border-2 border-sky-100 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:bg-sky-50 hover:border-sky-300 hover:shadow-lg transition-all duration-200 group active:scale-[0.97]"
            style={{ 
              animation: isVisible ? 'popInSuggestion 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
              animationDelay: `${index * 60}ms`
            }}
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" />
                </svg>
              </span>
              <span className="text-sm font-bold text-slate-700 leading-tight group-hover:text-slate-900">
                {suggestion}
              </span>
            </div>
          </button>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popInSuggestion {
          0% { opacity: 0; transform: translateY(10px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
};

export default SuggestionChips;
