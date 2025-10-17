import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface SimpleLineChartProps {
  data: ChartData[];
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data }) => {
  const width = 500;
  const height = 200;
  const padding = 20;

  const maxVal = Math.max(...data.map(p => p.value));
  const minVal = 0; // Assuming 0 as the baseline

  const getX = (index: number) => (width / (data.length - 1)) * index;
  const getY = (value: number) => height - padding - ((value - minVal) / (maxVal - minVal)) * (height - padding * 2);

  const path = data.map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(point.value)}`).join(' ');

  return (
    <div className="w-full h-64">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
            <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                <stop offset="95%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path d={`${path} V ${height} L 0 ${height} Z`} fill="url(#lineGradient)" />
        <path d={path} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((point, i) => (
            <g key={i}>
                <circle cx={getX(i)} cy={getY(point.value)} r="3" fill="#2563EB" />
                <text x={getX(i)} y={height - 5} textAnchor="middle" fill="currentColor" className="text-xs text-neutral-500 dark:text-neutral-400">{point.label}</text>
            </g>
        ))}
      </svg>
    </div>
  );
};