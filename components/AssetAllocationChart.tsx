
import React, { useState, useMemo } from 'react';
import { Token } from '../types';
import { Card } from './shared/Card';
import { Skeleton } from './shared/Skeleton';

interface AssetAllocationChartProps {
  tokens: Token[];
  loading: boolean;
  totalValue: number;
}

const COLORS = [
  '#2563EB', // brand-blue
  '#9333EA', // brand-purple
  '#10B981', // success
  '#F59E0B', // warning
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#6B7280', // neutral-500
];

const PieChart: React.FC<{ data: { name: string; value: number; color: string }[], total: number }> = ({ data, total }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const size = 200;
    const center = size / 2;
    const radius = size / 2 - 10;
    const hole = radius * 0.6;

    let accumulatedAngle = -Math.PI / 2;

    const handleMouseOver = (index: number) => setActiveIndex(index);
    const handleMouseOut = () => setActiveIndex(null);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((item, index) => {
                const percent = item.value / total;
                const angle = percent * 2 * Math.PI;
                
                const largeArc = percent > 0.5 ? 1 : 0;
                const currentRadius = activeIndex === index ? radius * 1.05 : radius;
                const currentHole = activeIndex === index ? hole * 0.95 : hole;
                
                const startXOuter = center + Math.cos(accumulatedAngle) * currentRadius;
                const startYOuter = center + Math.sin(accumulatedAngle) * currentRadius;
                const endXOuter = center + Math.cos(accumulatedAngle + angle) * currentRadius;
                const endYOuter = center + Math.sin(accumulatedAngle + angle) * currentRadius;
                
                const startXInner = center + Math.cos(accumulatedAngle) * currentHole;
                const startYInner = center + Math.sin(accumulatedAngle) * currentHole;
                const endXInner = center + Math.cos(accumulatedAngle + angle) * currentHole;
                const endYInner = center + Math.sin(accumulatedAngle + angle) * currentHole;

                const pathData = [
                    `M ${startXInner} ${startYInner}`,
                    `L ${startXOuter} ${startYOuter}`,
                    `A ${currentRadius} ${currentRadius} 0 ${largeArc} 1 ${endXOuter} ${endYOuter}`,
                    `L ${endXInner} ${endYInner}`,
                    `A ${currentHole} ${currentHole} 0 ${largeArc} 0 ${startXInner} ${startYInner}`,
                    'Z'
                ].join(' ');

                accumulatedAngle += angle;

                return <path key={item.name} d={pathData} fill={item.color} onMouseOver={() => handleMouseOver(index)} onMouseOut={handleMouseOut} className="transition-all duration-300" />;
            })}
        </svg>
    )
}

const SkeletonChart = () => (
    <div className="flex flex-col md:flex-row items-center justify-center p-4">
        <Skeleton className="w-48 h-48 rounded-full flex-shrink-0" />
        <div className="md:ml-8 mt-4 md:mt-0 space-y-3 w-40">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center w-full">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-20 ml-2" />
                    <Skeleton className="h-4 w-10 ml-auto" />
                </div>
            ))}
        </div>
    </div>
);


export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ tokens, loading, totalValue }) => {
    
    const chartData = useMemo(() => {
        if (!tokens || tokens.length === 0 || totalValue === 0) return [];
        const sortedTokens = [...tokens].sort((a, b) => b.value - a.value);
        const topTokens = sortedTokens.slice(0, 7);
        const otherTokensValue = sortedTokens.slice(7).reduce((acc, t) => acc + t.value, 0);

        const data = topTokens.map((token, index) => ({
            name: token.symbol,
            value: token.value,
            color: COLORS[index % COLORS.length]
        }));

        if (otherTokensValue > 0) {
            data.push({
                name: 'Others',
                value: otherTokensValue,
                color: COLORS[topTokens.length % COLORS.length]
            });
        }
        return data;
    }, [tokens, totalValue]);

    return (
        <Card>
            <Card.Header>
                <Card.Title>Asset Allocation</Card.Title>
                <Card.Description>Your portfolio distribution by value.</Card.Description>
            </Card.Header>
            <Card.Content>
                {loading ? <SkeletonChart /> : (
                    chartData.length > 0 ? (
                    <div className="flex flex-col md:flex-row items-center justify-center p-4 animate-fade-in">
                        <PieChart data={chartData} total={totalValue} />
                        <div className="md:ml-8 mt-4 md:mt-0 w-full max-w-xs">
                            <ul className="space-y-2">
                                {chartData.map(item => (
                                     <li key={item.name} className="flex items-center justify-between text-sm">
                                         <div className="flex items-center">
                                             <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                             <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.name}</span>
                                         </div>
                                         <div className="font-semibold text-neutral-900 dark:text-white">
                                             {((item.value / totalValue) * 100).toFixed(2)}%
                                         </div>
                                     </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    ) : (
                         <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
                            No allocation data available.
                        </div>
                    )
                )}
            </Card.Content>
        </Card>
    );
}
