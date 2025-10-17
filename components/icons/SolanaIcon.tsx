

import React from 'react';

export const SolanaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
    <defs>
      <linearGradient id="sol-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00FFA3"/>
        <stop offset="100%" stopColor="#DC1FFF"/>
      </linearGradient>
      <linearGradient id="sol-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00FFA3" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#DC1FFF" stopOpacity="0.2"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="#000"/>
    <path fill="url(#sol-grad1)" d="M7.7 11.5h16.5v2.8H7.7zM7.7 17.6h16.5v2.8H7.7zM7.7 23.8h16.5v2.8H7.7z"/>
  </svg>
);
