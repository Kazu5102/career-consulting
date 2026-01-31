
import React from 'react';

// FIX: Define props interface to support className and other SVG attributes
interface TargetIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const TargetIcon: React.FC<TargetIconProps> = ({ className, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "h-5 w-5"} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a3 3 0 100-6 3 3 0 000 6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3" />
  </svg>
);

export default TargetIcon;
