
import React from 'react';

// FIX: Define props interface to support className and other SVG attributes
interface TrajectoryIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

const TrajectoryIcon: React.FC<TrajectoryIconProps> = ({ className, ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className || "h-6 w-6"} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={1.5}
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-11.667-11.667l3.181 3.183m0 0l-3.181 3.183m0 0l3.181-3.183M3.75 9.348h4.992v-.001" />
    </svg>
);

export default TrajectoryIcon;
