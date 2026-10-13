import React from 'react';
import { MarketDto } from '../../shared/api/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  market?: MarketDto;
  priceHistory: number[];
}

export const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  market,
  priceHistory
}) => {
  const currentPrice = market?.price || 0;
  const isPositive = (market?.change24h || 0) >= 0;

  // Compute SVG line points
  const points = priceHistory.length > 1 ? priceHistory : [currentPrice * 0.999, currentPrice];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const width = 600;
  const height = 140;
  const paddingY = 15;

  const pathCoordinates = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - paddingY - ((p - min) / range) * (height - paddingY * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePath = `M ${pathCoordinates.join(' L ')}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const gradientId = `gradient-${symbol}`;

  return (
    <div className="glass-panel" style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              {symbol}
            </span>
            <span className={`badge ${isPositive ? 'badge-up' : 'badge-down'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isPositive ? '+' : ''}{(market?.change24h || 0).toFixed(2)}%
            </span>
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div>H: <span className="font-mono">${(market?.high24h || currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div>L: <span className="font-mono">${(market?.low24h || currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
          <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{points.length} Ticks Recorded</div>
        </div>
      </div>

      {/* SVG Interactive Sparkline Area */}
      <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Sparkline stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pulsing latest tick dot */}
          {points.length > 0 && (
            <circle
              cx={width}
              cy={height - paddingY - ((points[points.length - 1] - min) / range) * (height - paddingY * 2)}
              r="4"
              fill={strokeColor}
            />
          )}
        </svg>
      </div>
    </div>
  );
};
