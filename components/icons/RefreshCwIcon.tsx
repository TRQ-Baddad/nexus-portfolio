

import React from 'react';

export const RefreshCwIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12a9 9 0 0 1 9-9c2.5 0 4.8.9 6.5 2.5l-2.5 2.5" />
    <path d="M21 12a9 9 0 0 1-9 9c-2.5 0-4.8-.9-6.5-2.5l2.5-2.5" />
    <path d="M12 3v4h4" />
    <path d="M12 21v-4h-4" />
  </svg>
);
