

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Card } from './shared/Card';
import { HistoricalDataPoint, PortfolioValue } from '../types';
import { Skeleton } from './shared/Skeleton';
import { useUserPreferences } from '../hooks/useUserPreferences';

interface ChartsProps {
    historicalData: HistoricalDataPoint[];
    portfolioValue: PortfolioValue;
    loading: boolean;
}

type TimeRange = '24H' | '7D' | '30D' | '90D';

interface ActivePoint {
    mouseX: number; // Mouse X in SVG coords, for the vertical line
    pointX: number; // Data point X in SVG coords, for the circle
    pointY: number; // Data point Y in SVG coords, for the circle
    relativeX: number; // Data point X relative to container, for tooltip
    relativeY: number; // Data point Y relative to container, for tooltip
    data: HistoricalDataPoint;
}

const formatCompactCurrency = (value: number, formatFn: (v: number, o: Intl.NumberFormatOptions) => string) => {
  return formatFn(value, {
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
};

const TimeRangeButton: React.FC<{ label: TimeRange; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            isActive ? 'bg-brand-blue text-white' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
        }`}
    >
        {label}
    </button>
);


export const Charts: React.FC<ChartsProps> = ({ historicalData, portfolioValue, loading }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('30D');
    const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { formatCurrency } = useUserPreferences();

    const filteredData = useMemo(() => {
        if (historicalData.length === 0) return [];
    
        const now = Date.now();
        const days = { '24H': 1, '7D': 7, '30D': 30, '90D': 90 }[timeRange];
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        
        const validHistoricalData = historicalData.filter(d => Number.isFinite(d.value));
        if (validHistoricalData.length === 0) return [];

        let data = validHistoricalData.filter(d => d.timestamp >= cutoff);
    
        // If the filtered range is empty, grab the last known point before it to anchor the chart
        if (data.length === 0) {
            const lastPointBeforeRange = validHistoricalData.filter(d => d.timestamp < cutoff).pop();
            if (lastPointBeforeRange) {
                data = [lastPointBeforeRange];
            }
        }
        
        return data;
    }, [historicalData, timeRange]);

    const chartMetrics = useMemo(() => {
        if (filteredData.length < 1) return null;
        const startValue = filteredData[0].value;
        const endValue = filteredData[filteredData.length - 1].value;
        const changeValue = endValue - startValue;
        const changePercent = startValue > 0 ? (changeValue / startValue) * 100 : 0;
        return { startValue, endValue, changeValue, changePercent, isPositive: changeValue >= 0 };
    }, [filteredData]);

    const displayedPointData = activePoint?.data || (filteredData.length > 0 ? filteredData[filteredData.length - 1] : null);

    // Chart dimensions and calculations
    const width = 800;
    const height = 250;
    const yAxisPadding = 40;
    const padding = 5;
    const chartWidth = width - yAxisPadding;


    const values = filteredData.map(p => p.value);
    const timestamps = filteredData.map(p => p.timestamp);

    const minVal = values.length > 0 ? Math.min(...values) : 0;
    const maxVal = values.length > 0 ? Math.max(...values) : 0;
    const midVal = (minVal + maxVal) / 2;
    const minTime = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    const getX = useCallback((timestamp: number) => {
        if (maxTime - minTime === 0) return yAxisPadding + chartWidth / 2;
        return yAxisPadding + ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;
    }, [minTime, maxTime, chartWidth, yAxisPadding]);
    
    const getY = useCallback((value: number) => {
        const range = maxVal - minVal;
        if (range === 0) return height / 2;
        return height - (((value - minVal) / range) * (height - padding * 2) + padding);
    }, [minVal, maxVal, height, padding]);

    const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        const svg = svgRef.current;
        if (!svg || filteredData.length < 2) return;

        const svgRect = svg.getBoundingClientRect();
        // Get mouse X relative to the SVG element
        const svgX = event.clientX - svgRect.left;

        // Convert pixel coordinate to SVG user coordinate
        const userX = (svgX / svgRect.width) * width;
        
        const targetTime = minTime + ((userX - yAxisPadding) / chartWidth) * (maxTime - minTime);

        let closestPoint = filteredData[0];
        let smallestDiff = Math.abs(targetTime - closestPoint.timestamp);

        for (let i = 1; i < filteredData.length; i++) {
            const diff = Math.abs(targetTime - filteredData[i].timestamp);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestPoint = filteredData[i];
            }
        }
         
        const pointX = getX(closestPoint.timestamp);
        const pointY = getY(closestPoint.value);

        // For tooltip positioning, convert point's SVG user coords back to pixel coords relative to the SVG container
        const relativeX = (pointX / width) * svgRect.width;
        const relativeY = (pointY / height) * svgRect.height;

        setActivePoint({
            mouseX: userX,
            pointX,
            pointY,
            relativeX,
            relativeY,
            data: closestPoint,
        });
    }, [filteredData, getX, getY, minTime, maxTime, chartWidth, yAxisPadding, width, height]);

    const handleMouseLeave = () => {
        setActivePoint(null);
    };
    
    useEffect(() => {
        if (activePoint && tooltipRef.current && svgRef.current?.parentElement) {
            const tooltipEl = tooltipRef.current;
            const containerEl = svgRef.current.parentElement;

            const tooltipRect = tooltipEl.getBoundingClientRect();
            const containerRect = containerEl.getBoundingClientRect();

            // Use the pre-calculated relative coordinates for accurate positioning
            const chartX = activePoint.relativeX;
            const chartY = activePoint.relativeY;
            
            // Center tooltip on X, but keep it within container bounds
            let left = chartX - tooltipRect.width / 2;
            left = Math.max(5, Math.min(left, containerRect.width - tooltipRect.width - 5));

            // Position tooltip above the point. If there's not enough space, position it below.
            let top = chartY - tooltipRect.height - 15; // 15px offset
            if (top < 0) {
                top = chartY + 15;
            }

            tooltipEl.style.transform = `translate(${left}px, ${top}px)`;
            tooltipEl.style.opacity = '1';
        } else if (tooltipRef.current) {
            tooltipRef.current.style.opacity = '0';
        }
    }, [activePoint]);

    const path = filteredData.map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(point.timestamp)},${getY(point.value)}`).join(' ');
    
    return (
        <Card>
            <Card.Header>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Card.Title>Portfolio History</Card.Title>
                        <Card.Description>Your portfolio value over time.</Card.Description>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <TimeRangeButton label="24H" isActive={timeRange === '24H'} onClick={() => setTimeRange('24H')} />
                        <TimeRangeButton label="7D" isActive={timeRange === '7D'} onClick={() => setTimeRange('7D')} />
                        <TimeRangeButton label="30D" isActive={timeRange === '30D'} onClick={() => setTimeRange('30D')} />
                        <TimeRangeButton label="90D" isActive={timeRange === '90D'} onClick={() => setTimeRange('90D')} />
                    </div>
                </div>
                 <div className="mt-6 min-h-[64px]">
                    {loading ? (
                        <>
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-4 w-1/4 mt-2" />
                        </>
                    ) : (
                        <div className="animate-fade-in">
                            <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                                {formatCurrency(displayedPointData?.value ?? portfolioValue.total)}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {displayedPointData ? new Date(displayedPointData.timestamp).toLocaleString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
                                }) : chartMetrics ? (
                                    <span className={`font-medium ${chartMetrics.isPositive ? 'text-success' : 'text-error'}`}>
                                        {formatCurrency(chartMetrics.changeValue, { signDisplay: 'always'})} ({chartMetrics.isPositive ? '+' : ''}{chartMetrics.changePercent.toFixed(2)}%)
                                        <span className="text-neutral-500 dark:text-neutral-400 ml-1"> for period</span>
                                    </span>
                                ) : (
                                    'Current value'
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </Card.Header>
            <Card.Content className="px-4 pb-4">
                <div className="h-[250px] animate-fade-in relative">
                {loading ? (
                    <div className="px-2 sm:px-4 h-full"><Skeleton className="h-full w-full" /></div>
                ) : filteredData.length > 1 ? (
                    <>
                        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor={chartMetrics?.isPositive ? '#10B981' : '#EF4444'} stopOpacity="0.2" />
                                    <stop offset="95%" stopColor={chartMetrics?.isPositive ? '#10B981' : '#EF4444'} stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Y-Axis Labels */}
                            <text x={yAxisPadding - 8} y={getY(maxVal) + 4} textAnchor="end" fill="currentColor" className="text-xs text-neutral-400">{formatCompactCurrency(maxVal, formatCurrency)}</text>
                            <text x={yAxisPadding - 8} y={getY(midVal) + 4} textAnchor="end" fill="currentColor" className="text-xs text-neutral-400">{formatCompactCurrency(midVal, formatCurrency)}</text>
                            <text x={yAxisPadding - 8} y={getY(minVal) + 4} textAnchor="end" fill="currentColor" className="text-xs text-neutral-400">{formatCompactCurrency(minVal, formatCurrency)}</text>
                            
                            {[...Array(5)].map((_, i) => (
                               <line key={i} x1={yAxisPadding} x2={width} y1={i * (height/4)} y2={i * (height/4)} stroke="currentColor" className="text-neutral-200/50 dark:text-neutral-700/50" strokeWidth="0.5" />
                            ))}

                            <path d={`${path} L ${getX(filteredData[filteredData.length-1].timestamp)},${height} L ${getX(filteredData[0].timestamp)},${height} Z`} fill="url(#chartGradient)" />
                            <path d={path} fill="none" stroke={chartMetrics?.isPositive ? '#10B981' : '#EF4444'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                            
                            {activePoint && (
                                <g className="pointer-events-none">
                                    <line x1={activePoint.mouseX} y1="0" x2={activePoint.mouseX} y2={height} stroke="currentColor" className="text-neutral-400 dark:text-neutral-500" strokeWidth="1" strokeDasharray="3 3"/>
                                    <circle cx={activePoint.pointX} cy={activePoint.pointY} r="4" fill={chartMetrics?.isPositive ? '#10B981' : '#EF4444'} stroke="currentColor" className="stroke-white dark:stroke-neutral-800" strokeWidth="2" />
                                </g>
                            )}
                        </svg>
                        
                        <div
                            ref={tooltipRef}
                            className="absolute z-10 p-2 bg-neutral-900 text-white text-center rounded-md text-xs pointer-events-none transition-opacity duration-200 shadow-lg"
                            style={{ opacity: 0, top: 0, left: 0 }}
                        >
                            {activePoint && (
                                <>
                                    <p className="font-bold whitespace-nowrap">{formatCurrency(activePoint.data.value)}</p>
                                    <p className="text-neutral-400 whitespace-nowrap">{new Date(activePoint.data.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400">Not enough data to display chart for this period.</div>
                )}
                </div>
            </Card.Content>
        </Card>
    );
};