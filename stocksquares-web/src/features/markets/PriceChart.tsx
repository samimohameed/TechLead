import React, { useState, useMemo, useRef } from 'react';
import { MarketDto } from '../../shared/dtos';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { formatDateTime, formatTime, formatDateOnly } from '../../shared/utils/date.util';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  LineChart,
  Radio,
  Calendar
} from 'lucide-react';

export interface PriceTickHistoryItem {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  symbol: string;
  market?: MarketDto;
  priceHistory: PriceTickHistoryItem[];
}

type Timeframe = '1M' | '5M' | '15M' | '1H' | 'ALL';
type ChartType = 'line' | 'candle';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  market,
  priceHistory
}) => {
  const { t } = useTranslation();
  const [timeframe, setTimeframe] = useState<Timeframe>('5M');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPrice = market?.price || 0;
  const isPositive = (market?.change24h || 0) >= 0;

  // Filter history based on selected timeframe
  const filteredHistory = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      const now = Date.now();
      return [{ timestamp: now, price: currentPrice }];
    }

    if (timeframe === 'ALL') return priceHistory;

    const now = Date.now();
    const durations: Record<Timeframe, number> = {
      '1M': 60 * 1000,
      '5M': 5 * 60 * 1000,
      '15M': 15 * 60 * 1000,
      '1H': 60 * 60 * 1000,
      'ALL': Infinity
    };

    const cutoff = now - durations[timeframe];
    const subset = priceHistory.filter(p => p.timestamp >= cutoff);
    return subset.length >= 2 ? subset : priceHistory.slice(-20);
  }, [priceHistory, timeframe, currentPrice]);

  // Aggregate ticks into simulated candlesticks if in candle mode
  const candles = useMemo<CandleData[]>(() => {
    if (filteredHistory.length < 2) return [];

    const bucketCount = Math.min(24, Math.max(6, Math.floor(filteredHistory.length / 2)));
    const chunkSize = Math.max(1, Math.floor(filteredHistory.length / bucketCount));
    const result: CandleData[] = [];

    for (let i = 0; i < filteredHistory.length; i += chunkSize) {
      const chunk = filteredHistory.slice(i, i + chunkSize);
      if (chunk.length === 0) continue;

      const open = chunk[0].price;
      const close = chunk[chunk.length - 1].price;
      const high = Math.max(...chunk.map(c => c.price));
      const low = Math.min(...chunk.map(c => c.price));
      const time = chunk[chunk.length - 1].timestamp;

      result.push({ time, open, high, low, close });
    }
    return result;
  }, [filteredHistory]);

  // SVG Chart Geometry
  const width = 800;
  const height = 250;
  const paddingLeft = 45; // Space for X-axis start label
  const paddingRight = 80; // Space for Y-axis price labels
  const paddingTop = 16;
  const paddingBottom = 42; // Space for X-axis time & date timestamps

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const validPrices = filteredHistory
    .map(p => Number(p.price))
    .filter(p => !isNaN(p) && isFinite(p) && p > 0);

  const safeCurrent = !isNaN(currentPrice) && isFinite(currentPrice) && currentPrice > 0
    ? currentPrice
    : (validPrices[0] || 100);
  const allPrices = validPrices.length > 0 ? validPrices : [safeCurrent];

  const rawMin = Math.min(...allPrices);
  const rawMax = Math.max(...allPrices);
  const margin = Math.max(0.5, (rawMax - rawMin) * 0.12 || rawMax * 0.005);
  const minPrice = Math.max(0.0001, rawMin - margin);
  const maxPrice = rawMax + margin;
  const priceRange = Math.max(0.0001, maxPrice - minPrice);

  // Y-axis grid levels (4 evenly spaced steps)
  const yTicks = useMemo(() => {
    const steps = 3;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const price = minPrice + (i / steps) * priceRange;
      const y = height - paddingBottom - (i / steps) * plotHeight;
      return { price, y };
    });
  }, [minPrice, priceRange, height, paddingBottom, plotHeight]);

  // Coordinates for Line/Area chart
  const linePoints = useMemo(() => {
    if (filteredHistory.length <= 1) {
      const single = filteredHistory[0] || { timestamp: Date.now(), price: safeCurrent };
      const safeP = !isNaN(single.price) && isFinite(single.price) ? single.price : safeCurrent;
      const y = Math.max(paddingTop, Math.min(height - paddingBottom, height - paddingBottom - ((safeP - minPrice) / priceRange) * plotHeight));
      return [
        { x: paddingLeft, y, timestamp: single.timestamp, price: safeP },
        { x: paddingLeft + plotWidth, y, timestamp: single.timestamp, price: safeP }
      ];
    }

    return filteredHistory.map((p, idx) => {
      const safeP = !isNaN(p.price) && isFinite(p.price) ? p.price : safeCurrent;
      const x = paddingLeft + (idx / Math.max(1, filteredHistory.length - 1)) * plotWidth;
      const y = Math.max(paddingTop, Math.min(height - paddingBottom, height - paddingBottom - ((safeP - minPrice) / priceRange) * plotHeight));
      return { x, y, timestamp: p.timestamp, price: safeP };
    });
  }, [filteredHistory, minPrice, priceRange, plotHeight, plotWidth, paddingLeft, paddingBottom, height, safeCurrent, paddingTop]);

  const linePath = useMemo(() => {
    if (linePoints.length < 2) return '';
    return `M ${linePoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  }, [linePoints]);

  const areaPath = useMemo(() => {
    if (linePoints.length < 2) return '';
    const lastX = linePoints[linePoints.length - 1].x;
    const firstX = linePoints[0].x;
    const bottomY = height - paddingBottom;
    return `${linePath} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;
  }, [linePath, linePoints, height, paddingBottom]);

  // X-Axis timestamps (Exactly 4 unique evenly-spaced points, strictly within plot bounds)
  const xTicks = useMemo(() => {
    if (filteredHistory.length < 2) return [];
    const count = 4;
    const ticks: { x: number; timestamp: number }[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / (count - 1)) * (filteredHistory.length - 1));
      const item = filteredHistory[idx];
      const x = paddingLeft + (idx / (filteredHistory.length - 1)) * plotWidth;
      ticks.push({ x, timestamp: item.timestamp });
    }
    return ticks;
  }, [filteredHistory, paddingLeft, plotWidth]);

  // Mouse hover calculation
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - paddingLeft) / plotWidth));
    const targetIdx = Math.round(ratio * (filteredHistory.length - 1));
    setHoverIndex(targetIdx);
  };

  const activePoint = hoverIndex !== null && linePoints[hoverIndex] ? linePoints[hoverIndex] : null;

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const gradientId = `chart-grad-${symbol}`;

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Top Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '12px'
      }}>
        {/* Symbol & Main Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {symbol}
              </span>
              <span className={`badge ${isPositive ? 'badge-up' : 'badge-down'}`} style={{ padding: '2px 7px', fontSize: '0.6875rem' }}>
                {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {isPositive ? '+' : ''}{(market?.change24h || 0).toFixed(2)}%
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.625rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '9999px',
                background: market?.source === 'BINANCE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: market?.source === 'BINANCE' ? 'var(--color-up)' : 'var(--color-warning)',
                border: `1px solid ${market?.source === 'BINANCE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}>
                <Radio size={9} />
                {market?.source === 'BINANCE' ? t.liveStreaming : t.mockStreaming}
              </span>
            </div>
            <div className="font-mono" style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              marginTop: '2px',
              color: isPositive ? 'var(--color-up)' : 'var(--color-down)'
            }}>
              ${safeCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>
        </div>

        {/* 24h Metrics Breakdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '0.75rem',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase' }}>{t.high24h}</div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              ${(market?.high24h || safeCurrent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase' }}>{t.low24h}</div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              ${(market?.low24h || safeCurrent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)' }} />
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase' }}>{t.volume}</div>
            <div className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {(market?.volume24h || 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Timeframe & Chart Style Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Timeframe Chips */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            border: '1px solid var(--border-color)'
          }}>
            {(['1M', '5M', '15M', '1H', 'ALL'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  background: timeframe === tf ? 'var(--color-brand)' : 'transparent',
                  color: timeframe === tf ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Mode Switch (Line vs Candles) */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setChartType('line')}
              title="Line / Area View"
              style={{
                padding: '3px 6px',
                borderRadius: '3px',
                border: 'none',
                background: chartType === 'line' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: chartType === 'line' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <LineChart size={13} />
            </button>
            <button
              onClick={() => setChartType('candle')}
              title="Candlestick View"
              style={{
                padding: '3px 6px',
                borderRadius: '3px',
                border: 'none',
                background: chartType === 'candle' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: chartType === 'candle' ? 'var(--color-brand)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <BarChart2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart Canvas */}
      <div
        ref={containerRef}
        dir="ltr"
        style={{
          width: '100%',
          height: `${height}px`,
          position: 'relative',
          userSelect: 'none',
          direction: 'ltr'
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible', direction: 'ltr' }}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="70%" stopColor={strokeColor} stopOpacity="0.06" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={paddingLeft + plotWidth}
                y2={tick.y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft + plotWidth + 8}
                y={tick.y + 4}
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="start"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              >
                ${tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </text>
            </g>
          ))}

          {/* Vertical Grid Lines & X-Axis Time / Date Labels */}
          {xTicks.map((tick, i) => {
            const anchor = i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle';
            const textX = i === 0 ? tick.x + 2 : i === xTicks.length - 1 ? tick.x - 2 : tick.x;

            return (
              <g key={i}>
                <line
                  x1={tick.x}
                  y1={paddingTop}
                  x2={tick.x}
                  y2={height - paddingBottom}
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeDasharray="4 4"
                />
                <text
                  x={textX}
                  y={height - paddingBottom + 14}
                  fill="var(--text-muted)"
                  fontSize="9.5"
                  fontFamily="var(--font-mono)"
                  textAnchor={anchor}
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                >
                  {formatTime(tick.timestamp)}
                </text>
                <text
                  x={textX}
                  y={height - paddingBottom + 27}
                  fill="rgba(148, 163, 184, 0.55)"
                  fontSize="8.5"
                  fontFamily="var(--font-mono)"
                  textAnchor={anchor}
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                >
                  {formatDateOnly(tick.timestamp)}
                </text>
              </g>
            );
          })}

          {/* Render Candlesticks if chartType === 'candle' */}
          {chartType === 'candle' && candles.map((c, idx) => {
            const candleWidth = Math.max(5, (plotWidth / candles.length) * 0.65);
            const x = paddingLeft + (idx / Math.max(1, candles.length - 1)) * plotWidth;
            const isGreen = c.close >= c.open;
            const candleColor = isGreen ? '#10b981' : '#f43f5e';

            const openY = height - paddingBottom - ((c.open - minPrice) / priceRange) * plotHeight;
            const closeY = height - paddingBottom - ((c.close - minPrice) / priceRange) * plotHeight;
            const highY = height - paddingBottom - ((c.high - minPrice) / priceRange) * plotHeight;
            const lowY = height - paddingBottom - ((c.low - minPrice) / priceRange) * plotHeight;

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY));

            return (
              <g key={idx}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="1.5"
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  rx="1"
                />
              </g>
            );
          })}

          {/* Render Area & Line if chartType === 'line' */}
          {chartType === 'line' && (
            <>
              {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* Current Live Price Level Indicator on Right Axis */}
          {(() => {
            const currentY = Math.max(
              paddingTop,
              Math.min(height - paddingBottom, height - paddingBottom - ((safeCurrent - minPrice) / priceRange) * plotHeight)
            );
            return (
              <g>
                <line
                  x1={paddingLeft}
                  y1={currentY}
                  x2={paddingLeft + plotWidth}
                  y2={currentY}
                  stroke={strokeColor}
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  opacity="0.8"
                />
                <rect
                  x={paddingLeft + plotWidth + 4}
                  y={currentY - 9}
                  width="68"
                  height="18"
                  rx="3"
                  fill={strokeColor}
                />
                <text
                  x={paddingLeft + plotWidth + 38}
                  y={currentY + 4}
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                >
                  ${safeCurrent.toFixed(2)}
                </text>
              </g>
            );
          })()}

          {/* Interactive Crosshair & Cursor */}
          {activePoint && (
            <g>
              {/* Vertical Crosshair */}
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={height - paddingBottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              {/* Horizontal Crosshair */}
              <line
                x1={paddingLeft}
                y1={activePoint.y}
                x2={paddingLeft + plotWidth}
                y2={activePoint.y}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              {/* Active Dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="5"
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: activePoint.x > width / 2 ? `${Math.max(16, (activePoint.x / width) * 100 - 30)}%` : `${Math.min(70, (activePoint.x / width) * 100 + 4)}%`,
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: '0.75rem',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: '170px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', marginBottom: '3px' }}>
              <Calendar size={11} />
              <span className="font-mono">{formatDateTime(activePoint.timestamp)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.price}:</span>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.8125rem', color: strokeColor }}>
                ${activePoint.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '6px',
        paddingTop: '6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '0.6875rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          <span>{t.timeframe}: <strong style={{ color: 'var(--text-secondary)' }}>{timeframe}</strong></span>
          <span style={{ margin: '0 6px' }}>•</span>
          <span>{t.ticksRecorded}: <strong className="font-mono" style={{ color: 'var(--text-secondary)' }}>{filteredHistory.length}</strong></span>
        </div>
        <div>
          <span>{t.lastUpdated}: <span className="font-mono">{formatDateTime(market?.timestamp || Date.now())}</span></span>
        </div>
      </div>
    </div>
  );
};
