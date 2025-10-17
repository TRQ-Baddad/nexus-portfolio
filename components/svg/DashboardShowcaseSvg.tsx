import React from 'react';

export const DashboardShowcaseSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 400 225" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Abstract representation of the Nexus dashboard</title>
    <defs>
      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stopColor="var(--color-brand-blue)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="var(--color-brand-blue)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--color-brand-blue)" />
        <stop offset="100%" stopColor="var(--color-brand-purple)" />
      </linearGradient>
    </defs>
    
    <rect width="400" height="225" rx="8" fill="rgba(255, 255, 255, 0.05)" />

    <rect x="16" y="16" width="368" height="50" rx="4" fill="rgba(255, 255, 255, 0.07)" />
    <rect x="28" y="28" width="80" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
    <rect x="28" y="44" width="120" height="10" rx="3" fill="url(#lineGradient)" />

    <rect x="16" y="82" width="240" height="127" rx="4" fill="rgba(255, 255, 255, 0.07)" />
    <path d="M28 197 L 28 170 C 50 160, 70 140, 95 145 S 130 170, 155 160 S 190 130, 215 135 S 244 165, 244 165 L 244 197 Z" fill="url(#chartGradient)" />
    <path d="M28 170 C 50 160, 70 140, 95 145 S 130 170, 155 160 S 190 130, 215 135 S 244 165, 244 165" stroke="url(#lineGradient)" strokeWidth="2" fill="none" />
    <circle cx="244" cy="165" r="3" fill="var(--color-brand-purple)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />

    <rect x="272" y="82" width="112" height="60" rx="4" fill="rgba(255, 255, 255, 0.07)" />
    <rect x="284" y="94" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.2)" />
    <rect x="284" y="108" width="70" height="8" rx="2" fill="rgba(255, 255, 255, 0.4)" />
    <rect x="284" y="122" width="40" height="6" rx="2" fill="rgba(16, 185, 129, 0.5)" />

    <rect x="272" y="149" width="112" height="60" rx="4" fill="rgba(255, 255, 255, 0.07)" />
    <rect x="284" y="161" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.2)" />
    <rect x="284" y="175" width="70" height="8" rx="2" fill="rgba(255, 255, 255, 0.4)" />
    <rect x="284" y="189" width="40" height="6" rx="2" fill="rgba(239, 68, 68, 0.5)" />
  </svg>
);