
import React from 'react';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}


const Header: React.FC<HeaderProps> = ({ showBackButton, onBackClick }) => {
  
  return (
    <header className="w-full bg-white shadow-md p-4 border-b border-slate-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={onBackClick}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="履歴一覧に戻る"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  Career Consulting
                </h1>
              </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
