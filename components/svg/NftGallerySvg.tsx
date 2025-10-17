import React from 'react';
    
export const NftGallerySvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Abstract representation of an NFT gallery</title>
    <defs>
      <linearGradient id="nft-grad-1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--color-brand-blue)" />
        <stop offset="100%" stopColor="var(--color-brand-purple)" />
      </linearGradient>
      <linearGradient id="nft-grad-2" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
       <pattern id="nft-patt-1" patternUnits="userSpaceOnUse" width="12" height="12">
        <path d="M0 0 H6 V6 H0 Z" fill="rgba(255,255,255,0.2)"/>
        <path d="M6 6 H12 V12 H6 Z" fill="rgba(255,255,255,0.2)"/>
      </pattern>
    </defs>

    <g transform="translate(10, 10)">
        {/* Card 1 */}
        <rect width="85" height="85" rx="6" fill="url(#nft-grad-1)" />
        <circle cx="42.5" cy="42.5" r="20" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="4" />
        
        {/* Card 2 */}
        <rect x="95" width="85" height="85" rx="6" fill="url(#nft-grad-2)" />
        <path d="M115 20 L 160 65 M 160 20 L 115 65" stroke="white" strokeOpacity="0.5" strokeWidth="4" />

        {/* Card 3 */}
        <rect y="95" width="85" height="85" rx="6" fill="var(--color-brand-blue)" />
        <rect y="95" width="85" height="85" rx="6" fill="url(#nft-patt-1)" />

        {/* Card 4 */}
        <rect x="95" y="95" width="85" height="85" rx="6" fill="var(--color-brand-purple)" />
        <rect x="115" y="115" width="45" height="45" rx="3" fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="4" strokeDasharray="5 5" />
    </g>
  </svg>
);