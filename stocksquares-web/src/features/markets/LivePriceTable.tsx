import React from 'react';
import { MarketDto } from '../../shared/api/types';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface LivePriceTableProps {
  markets: Record<string, MarketDto>;
  tickFlashes: Record<string, 'up' | 'down'>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const LivePriceTable: React.FC<LivePriceTableProps> = ({
  markets,
  tickFlashes,
  selectedSymbol,
  onSelectSymbol
}) => {
  const { t } = useTranslation();
  const marketList = Object.values(markets);

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={18} style={{ color: 'var(--color-brand)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            {t.markets}
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {marketList.length} Active Feeds
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.symbol}</th>
              <th>{t.price}</th>
              <th>{t.change24h}</th>
              <th>{t.high24h}</th>
              <th>{t.low24h}</th>
              <th>{t.source}</th>
            </tr>
          </thead>
          <tbody>
            {marketList.map(market => {
              const isSelected = market.symbol === selectedSymbol;
              const flash = tickFlashes[market.symbol];
              const isPositive = market.change24h >= 0;

              return (
                <tr
                  key={market.symbol}
                  onClick={() => onSelectSymbol(market.symbol)}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59, 130, 246, 0.12)' : undefined,
                    borderLeft: isSelected ? '3px solid var(--color-brand)' : '3px solid transparent'
                  }}
                >
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono">{market.symbol}</span>
                      {isSelected && (
                        <span style={{ fontSize: '0.625rem', padding: '1px 5px', borderRadius: '4px', background: 'var(--color-brand)', color: '#fff' }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span
                      className={`font-mono ${flash === 'up' ? 'tick-flash-up text-up' : flash === 'down' ? 'tick-flash-down text-down' : ''}`}
                      style={{
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}
                    >
                      ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${isPositive ? 'badge-up' : 'badge-down'}`} style={{ gap: '2px' }}>
                      {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                      {isPositive ? '+' : ''}{market.change24h.toFixed(2)}%
                    </span>
                  </td>

                  <td className="font-mono text-secondary" style={{ fontSize: '0.8125rem' }}>
                    ${market.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>

                  <td className="font-mono text-secondary" style={{ fontSize: '0.8125rem' }}>
                    ${market.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                  </td>

                  <td>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: market.source === 'BINANCE' ? 'rgba(240, 185, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: market.source === 'BINANCE' ? '#f0b90b' : '#818cf8',
                        border: `1px solid ${market.source === 'BINANCE' ? 'rgba(240, 185, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
                      }}
                    >
                      {market.source}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
