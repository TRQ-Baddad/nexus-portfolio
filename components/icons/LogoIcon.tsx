

import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#2563EB', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#9333EA', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <path d="M12 2L4 6L12 10L20 6L12 2Z" fill="url(#grad1)" />
    <path d="M4 18L12 22L20 18" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 12L12 16L20 12" stroke="url(#grad1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
