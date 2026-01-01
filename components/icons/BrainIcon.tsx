import React from 'react';

const BrainIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 13.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0V15m0-1.5a1.5 1.5 0 10-3 0m3 0V9.5m0 5.5a1.5 1.5 0 103 0m-3 0V15m-6-3a1.5 1.5 0 103 0m-3 0V9.5m0 5.5a1.5 1.5 0 103 0m-3 0V15m0-1.5a1.5 1.5 0 11-3 0m3 0V9.5m6 5.5a1.5 1.5 0 103 0m-3 0V9.5m0 5.5a1.5 1.5 0 103 0m-3 0V15M6.5 9.5a1.5 1.5 0 103 0m-3 0V8m0 1.5a1.5 1.5 0 11-3 0m3 0V8m6 3.5a1.5 1.5 0 103 0m-3 0V8m0 3.5a1.5 1.5 0 11-3 0m3 0V8m9 3.5a1.5 1.5 0 103 0m-3 0V8m0 3.5a1.5 1.5 0 11-3 0m3 0V8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    </svg>
);

export default BrainIcon;
