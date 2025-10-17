
import React from 'react';

export const GridPattern: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg aria-hidden="true" className={className}>
      <defs>
        <pattern
          id="grid-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x="50%"
          y="50%"
        >
          <path d="M.5 40V.5H40" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill="url(#grid-pattern)" />
    </svg>
  );
};