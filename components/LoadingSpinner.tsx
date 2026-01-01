
import React from 'react';
import RobotIcon from './icons/RobotIcon';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-end gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
        <RobotIcon />
      </div>
      <div className="px-5 py-3 rounded-2xl rounded-bl-lg bg-slate-200 text-slate-800">
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
