import React from 'react';

const Row = ({ y, highlight }: { y: number; highlight?: boolean }) => (
  <g>
    <rect x="0" y={y} width="250" height="30" rx="4" fill={highlight ? "rgba(255, 255, 255, 0.07)" : "transparent"} />
    <circle cx="15" cy={y + 15} r="8" fill="rgba(255, 255, 255, 0.2)" />
    <rect x="35" y={y + 8} width="60" height="6" rx="2" fill="rgba(255, 255, 255, 0.5)" />
    <rect x="35" y={y + 18} width="30" height="4" rx="2" fill="rgba(255, 255, 255, 0.3)" />
    <rect x="120" y={y + 11} width="40" height="8" rx="2" fill="rgba(255, 255, 255, 0.4)" />
    <rect x="180" y={y + 11} width="50" height="8" rx="2" fill="rgba(16, 185, 129, 0.7)" />
  </g>
);

export const TokenTableSvg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 250 180" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>Abstract representation of a token table</title>
    <Row y={10} highlight />
    <Row y={50} />
    <Row y={90} highlight />
    <Row y={130} />
  </svg>
);