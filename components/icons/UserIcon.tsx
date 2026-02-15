
import React from 'react';

// FIX: Define props interface to support className and other SVG attributes
interface UserIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const UserIcon: React.FC<UserIconProps> = ({ className, ...props }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "h-5 w-5 text-white"} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default UserIcon;
