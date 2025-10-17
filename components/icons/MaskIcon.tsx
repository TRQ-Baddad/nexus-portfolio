import React from 'react';

export const MaskIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M4 14.5A8.5 8.5 0 0 1 12 6a8.5 8.5 0 0 1 8 8.5" />
        <path d="M12 6v2" />
        <path d="M21 12h-2" />
        <path d="M3 12H1" />
        <path d="M7.5 16q.5-1 1-2t1.5-2" />
        <path d="M14 12q.5 1 1 2t1.5 2" />
    </svg>
);