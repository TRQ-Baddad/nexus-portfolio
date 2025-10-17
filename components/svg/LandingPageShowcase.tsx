import React from 'react';

export const LandingPageShowcase: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Showcase</title>
    <rect width="200" height="200" rx="8" fill="#222" />
    <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#888" fontSize="16">Showcase</text>
  </svg>
);
