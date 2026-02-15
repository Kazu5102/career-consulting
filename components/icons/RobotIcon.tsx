
import React from 'react';

interface RobotIconProps {
  isThinking?: boolean;
}

const RobotIcon: React.FC<RobotIconProps> = ({ isThinking }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-600 ${isThinking ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3m6-12h-2.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-1.414 0l-1.414-1.414A1 1 0 009.586 6H7m10 6h-2.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-1.414 0l-1.414-1.414A1 1 0 009.586 12H7m10 6h-2.586a1 1 0 00-.707.293l-1.414 1.414a1 1 0 01-1.414 0l-1.414-1.414A1 1 0 009.586 18H7" />
    </svg>
);

export default RobotIcon;