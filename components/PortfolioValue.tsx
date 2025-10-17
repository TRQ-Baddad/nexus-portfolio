

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PortfolioValue as PortfolioValueType, HistoricalDataPoint } from '../types';
import { Skeleton } from './shared/Skeleton';
import { ArrowUpRightIcon } from './icons/ArrowUpRightIcon';
import { ArrowDownRightIcon } from './icons/ArrowDownRightIcon';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { Share2Icon } from './icons/Share2Icon';
import { formatRelativeTime } from '../utils/formatters';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Button } from './shared/Button';
import { LayoutGridIcon } from './icons/LayoutGridIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';

interface PortfolioValueProps {
  data: PortfolioValueType;
  loading: boolean;
  refreshPortfolio: () => void;
  onShare: () => void;
  lastUpdated: Date | null;
  historicalData: HistoricalDataPoint[];
  canCustomize?: boolean;
  isEditMode?: boolean;
  onCustomize?: () => void;
  onSaveLayout?: () => void;
  onCancelLayout?: () => void;
}

interface ActivePoint {
    mouseX: number; // Mouse X in SVG coords, for the vertical line
    pointX: number; // Data point X in SVG coords, for the circle
    pointY: number; // Data point Y in SVG coords, for the circle
    relativeX: number; // Data point X relative to container, for tooltip
    relativeY: number; // Data point Y relative to container, for tooltip
    data: HistoricalDataPoint;
}

type TimeRange = '24H' | '7D' | '30D' | '90D';

const TimeRangeButton: React.FC<{ label: TimeRange; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
            isActive ? 'bg-brand-blue text-white' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200'
        }`}
    >
        {label}
    </button>
);

const Stat: React.FC<{ title: string; value: string; change?: number; loading: boolean }> = ({ title, value, change, loading }) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{title}</h3>
      {loading ? (
        <>
          <Skeleton className="h-8 w-3/4 mt-1" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </>
      ) : (
        <div className="animate-fade-in">
          <p className="text-2xl font-semibold text-neutral-900 dark:text-white mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center text-sm font-medium mt-1 ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? (
                <ArrowUpRightIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRightIcon className="w-4 h-4 mr-1" />
              )}
              <span>{change.toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const PortfolioValue: React.FC<PortfolioValueProps> = ({ 
  data, 
  loading, 
  refreshPortfolio, 
  onShare, 
  lastUpdated, 
  historicalData,
  canCustomize,
  isEditMode,
  onCustomize,
  onSaveLayout,
  onCancelLayout
}) => {
  const { formatCurrency } = useUserPreferences();
  
  const [relativeTime, setRelativeTime] = useState(formatRelativeTime(lastUpdated));
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
        if (entries[0]) {
            const { width, height } = entries[0].contentRect;
            setChartDimensions({ width, height });
        }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.unobserve(container);
  }, []);

  useEffect(() => {
      setRelativeTime(formatRelativeTime(lastUpdated));
      const timer = setInterval(() => {
          setRelativeTime(formatRelativeTime(lastUpdated));
      }, 10000);
      return () => clearInterval(timer);
  }, [lastUpdated]);

  const chartRenderData = useMemo(() => {
    const { width, height } = chartDimensions;
    if (!historicalData || historicalData.length < 2 || width === 0 || height === 0) return null;

    const now = Date.now();
    const days = { '24H': 1, '7D': 7, '30D': 30, '90D': 90 }[timeRange];
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    
    const filteredData = historicalData.filter(d => d.timestamp >= cutoff && Number.isFinite(d.value));
    if (filteredData.length < 2) return null;

    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const values = filteredData.map(p => p.value);
    const timestamps = filteredData.map(p => p.timestamp);

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    const getX = (timestamp: number) => {
        if (maxTime - minTime === 0) return width / 2;
        return padding + ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;
    };
    
    const getY = (value: number) => {
        const range = maxVal - minVal;
        if (range === 0) return height / 2;
        return height - padding - (((value - minVal) / range) * chartHeight);
    };

    const path = filteredData.map((point, i) => `${i === 0 ? 'M' : 'L'} ${getX(point.timestamp).toFixed(2)},${getY(point.value).toFixed(2)}`).join(' ');
    const gradientPath = `${path} L ${getX(maxTime).toFixed(2)},${height} L ${getX(minTime).toFixed(2)},${height} Z`;
    
    const endPoint = { x: getX(maxTime), y: getY(values[values.length - 1]) };
    const isPositiveTrend = values[values.length - 1] >= values[0];
    const color = isPositiveTrend ? '#10B981' : '#EF4444';

    return { path, gradientPath, endPoint, color, width, height, getX, getY, filteredData, minTime, maxTime, chartWidth, padding };
  }, [historicalData, chartDimensions, timeRange]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !chartRenderData) return;

      const { getX, getY, filteredData, minTime, maxTime, chartWidth, padding, width, height } = chartRenderData;
      const svgRect = svg.getBoundingClientRect();
      const svgX = event.clientX - svgRect.left;
      const userX = (svgX / svgRect.width) * width;

      const targetTime = minTime + ((userX - padding) / chartWidth) * (maxTime - minTime);
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
      const relativeX = (pointX / width) * svgRect.width;
      const relativeY = (pointY / height) * svgRect.height;

      setActivePoint({ mouseX: userX, pointX, pointY, relativeX, relativeY, data: closestPoint });
  }, [chartRenderData]);

  const handleMouseLeave = useCallback(() => {
      setActivePoint(null);
  }, []);

  useEffect(() => {
      if (activePoint && tooltipRef.current && chartContainerRef.current) {
          const tooltipEl = tooltipRef.current;
          const containerRect = chartContainerRef.current.getBoundingClientRect();
          const tooltipRect = tooltipEl.getBoundingClientRect();
          let left = activePoint.relativeX - tooltipRect.width / 2;
          left = Math.max(5, Math.min(left, containerRect.width - tooltipRect.width - 5));
          let top = activePoint.relativeY - tooltipRect.height - 15;
          if (top < 0) top = activePoint.relativeY + 15;
          tooltipEl.style.transform = `translate(${left}px, ${top}px)`;
          tooltipEl.style.opacity = '1';
      } else if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
      }
  }, [activePoint]);

  const displayedPointData = activePoint?.data || (chartRenderData?.filteredData.length ? chartRenderData.filteredData[chartRenderData.filteredData.length - 1] : null);
  const formattedTotal = formatCurrency(displayedPointData?.value ?? data.total);
  const formattedChange = formatCurrency(data.change24h, { signDisplay: 'always' });

  return (
    <div className="relative bg-white dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700/50 w-full">
      <div className="absolute top-6 right-6 flex items-center space-x-2 z-10">
        {canCustomize && (
          isEditMode ? (
            <div className="flex items-center space-x-2">
              <Button variant="secondary" onClick={onCancelLayout} size="sm">
                <XIcon className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={onSaveLayout} size="sm">
                <CheckIcon className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={onCustomize} size="sm">
              <LayoutGridIcon className="w-4 h-4 mr-1" />
              Customize
            </Button>
          )
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Total Value</h3>
          {loading ? (
            <Skeleton className="h-12 w-3/4 mt-2" />
          ) : (
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue to-brand-purple mt-2 animate-fade-in">{formattedTotal}</p>
          )}
        </div>

        <div className="border-t border-neutral-200/80 dark:border-neutral-700/80 md:border-t-0 md:border-l md:pl-6">
          <Stat 
            title="24h Change"
            value={formattedChange}
            loading={loading}
          />
        </div>
        
        <div className="border-t border-neutral-200/80 dark:border-neutral-700/80 md:border-t-0 md:border-l md:pl-6">
           <Stat 
            title="24h Return"
            value={`${data.change24hPercent >= 0 ? '+' : ''}${data.change24hPercent.toFixed(2)}%`}
            change={data.change24hPercent}
            loading={loading}
          />
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-end space-x-2 mb-2">
            <TimeRangeButton label="24H" isActive={timeRange === '24H'} onClick={() => setTimeRange('24H')} />
            <TimeRangeButton label="7D" isActive={timeRange === '7D'} onClick={() => setTimeRange('7D')} />
            <TimeRangeButton label="30D" isActive={timeRange === '30D'} onClick={() => setTimeRange('30D')} />
            <TimeRangeButton label="90D" isActive={timeRange === '90D'} onClick={() => setTimeRange('90D')} />
        </div>
        <div ref={chartContainerRef} className="h-24 mb-4 px-0 relative">
            {loading ? (
            <Skeleton className="h-full w-full" />
            ) : chartRenderData ? (
            <>
                <svg ref={svgRef} viewBox={`0 0 ${chartRenderData.width} ${chartRenderData.height}`} className="w-full h-full overflow-visible" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <defs>
                    <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartRenderData.color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={chartRenderData.color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={chartRenderData.gradientPath} fill="url(#sparklineGradient)" />
                <path d={chartRenderData.path} fill="none" stroke={chartRenderData.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={chartRenderData.endPoint.x} cy={chartRenderData.endPoint.y} r="3" fill={chartRenderData.color} stroke="var(--color-bg-neutral-50)" strokeWidth="2" />

                {activePoint && (
                    <g className="pointer-events-none">
                    <line x1={activePoint.mouseX} y1="0" x2={activePoint.mouseX} y2={chartRenderData.height} stroke="currentColor" className="text-neutral-400 dark:text-neutral-500" strokeWidth="1" strokeDasharray="3 3"/>
                    <circle cx={activePoint.pointX} cy={activePoint.pointY} r="4" fill={chartRenderData.color} stroke="var(--color-bg-neutral-100)" className="dark:stroke-neutral-800" strokeWidth="2" />
                    </g>
                )}
                </svg>
                <div
                    ref={tooltipRef}
                    className="absolute z-10 p-2 bg-neutral-900 text-white text-center rounded-md text-xs pointer-events-none transition-opacity duration-100 shadow-lg"
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
            ) : null}
        </div>
      </div>

       <div className="absolute bottom-6 right-6 flex items-center space-x-4">
         {!loading && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block min-h-[16px]">
                {activePoint 
                    ? new Date(activePoint.data.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                    : relativeTime ? `Updated ${relativeTime}` : ''
                }
            </p>
        )}
        <div className="flex items-center space-x-2">
            <button 
              onClick={onShare}
              disabled={loading}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-transform duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-wait"
              title="Share Portfolio Snapshot"
            >
              <Share2Icon className="w-5 h-5" />
            </button>
            <button 
              onClick={refreshPortfolio}
              disabled={loading}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-transform duration-200 hover:rotate-90 disabled:opacity-50 disabled:cursor-wait"
              title="Refresh Portfolio"
            >
              <RefreshCwIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>
    </div>
  );
};