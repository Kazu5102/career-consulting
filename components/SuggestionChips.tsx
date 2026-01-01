import React from 'react';

interface SuggestionChipsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onSuggestionClick }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pt-2 border-t border-slate-100">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <p className="text-xs text-slate-500 font-semibold flex-shrink-0">次の質問候補:</p>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex-shrink-0 px-3 py-1.5 bg-sky-100 text-sky-800 text-sm font-semibold rounded-full hover:bg-sky-200 transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

// Add a simple fade-in animation to tailwind.css if possible, or use inline styles/classes.
// For the purpose of this project, we can assume a global CSS with this keyframe might exist:
/*
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
  opacity: 0;
}
*/
// Since we can't add CSS files, we will rely on the inline style for animation delay and a class name.

export default SuggestionChips;
