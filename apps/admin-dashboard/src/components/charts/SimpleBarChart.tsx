import React from 'react';

interface ChartData {
  label:string;
  value: number;
}

interface SimpleBarChartProps {
  data: ChartData[];
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data }) => {
  const width = 500;
  const height = 200;
  const padding = 20;
  const barWidth = (width / data.length) * 0.6;
  const barSpacing = (width / data.length) * 0.4;

  const maxVal = Math.max(...data.map(p => p.value));

  const getY = (value: number) => height - padding - (value / maxVal) * (height - padding * 2);
  const getBarHeight = (value: number) => (value / maxVal) * (height - padding * 2);

  return (
    <div className="w-full h-64">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {data.map((point, i) => {
          const x = (barWidth + barSpacing) * i + barSpacing / 2;
          return (
            <g key={i}>
              <rect
                x={x}
                y={getY(point.value)}
                width={barWidth}
                height={getBarHeight(point.value)}
                fill="#2563EB"
                className="hover:opacity-80 transition-opacity"
              />
               <text x={x + barWidth / 2} y={height - 5} textAnchor="middle" fill="currentColor" className="text-xs text-neutral-500 dark:text-neutral-400">{point.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};