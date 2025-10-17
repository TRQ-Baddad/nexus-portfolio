import React from 'react';

export const SmartMoneySvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 250 180" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Abstract representation of smart money tracking</title>
    <defs>
      <linearGradient id="whaleGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--color-brand-blue)" />
        <stop offset="100%" stopColor="var(--color-brand-purple)" />
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Whale */}
    <circle cx="125" cy="90" r="30" fill="url(#whaleGradient)" filter="url(#glow)" />
    
    {/* Followers */}
    <circle cx="50" cy="50" r="10" fill="rgba(255,255,255,0.4)" />
    <circle cx="200" cy="60" r="12" fill="rgba(255,255,255,0.4)" />
    <circle cx="70" cy="140" r="8" fill="rgba(255,255,255,0.4)" />
    <circle cx="180" cy="130" r="15" fill="rgba(255,255,255,0.4)" />

    {/* Connecting lines */}
    <path d="M60 55 Q 90 70 110 80" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M190 68 Q 160 75 140 85" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M78 135 Q 100 120 115 105" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M170 125 Q 150 110 135 100" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3" />
  </svg>
);