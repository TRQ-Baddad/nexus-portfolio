import React from 'react';

interface ChartData {
    label: string;
    value: number;
    color: string;
}

interface SimpleDoughnutChartProps {
    data: ChartData[];
}

export const SimpleDoughnutChart: React.FC<SimpleDoughnutChartProps> = ({ data }) => {
    const size = 200;
    const center = size / 2;
    const radius = size / 2 - 10;
    const hole = radius * 0.6;
    const total = data.reduce((acc, item) => acc + item.value, 0);
    let accumulatedAngle = -Math.PI / 2;

    return (
        <div className="flex items-center justify-center p-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {data.map((item) => {
                    const percent = item.value / total;
                    const angle = percent * 2 * Math.PI;
                    const largeArc = percent > 0.5 ? 1 : 0;

                    const startX = center + Math.cos(accumulatedAngle) * radius;
                    const startY = center + Math.sin(accumulatedAngle) * radius;
                    const endX = center + Math.cos(accumulatedAngle + angle) * radius;
                    const endY = center + Math.sin(accumulatedAngle + angle) * radius;

                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
                    ].join(' ');
                    
                    accumulatedAngle += angle;

                    return <path key={item.label} d={pathData} stroke={item.color} strokeWidth="20" fill="none" />;
                })}
            </svg>
            <div className="ml-8">
                <ul>
                    {data.map(item => (
                        <li key={item.label} className="flex items-center space-x-2 py-1">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.label}</span>
                            <span className="text-sm font-semibold text-neutral-900 dark:text-white">({((item.value/total)*100).toFixed(1)}%)</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};