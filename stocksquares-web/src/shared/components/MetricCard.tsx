import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  trend = 'neutral',
  icon
}) => {
  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label}
        </span>
        {icon && (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span className="font-mono" style={{ fontSize: '1.625rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {subValue && (
          <span
            className={`font-mono ${trend === 'up' ? 'text-up' : trend === 'down' ? 'text-down' : 'text-muted'}`}
            style={{ fontSize: '0.875rem', fontWeight: 600 }}
          >
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};
