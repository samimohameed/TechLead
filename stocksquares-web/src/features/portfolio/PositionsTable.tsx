import React from 'react';
import { PositionDto } from '../../shared/api/types';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { Briefcase, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PositionsTableProps {
  positions: PositionDto[];
  onSelectSymbol: (symbol: string) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onSelectSymbol
}) => {
  const { t } = useTranslation();

  const activePositions = positions.filter(p => p.quantity > 0);

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
          <Briefcase size={18} style={{ color: 'var(--color-brand)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            {t.positions}
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {activePositions.length} Active Holdings
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.symbol}</th>
              <th>{t.quantity}</th>
              <th>{t.avgEntry}</th>
              <th>{t.currentPrice}</th>
              <th>{t.marketValue}</th>
              <th>{t.unrealizedPnl}</th>
              <th>{t.realizedPnl}</th>
              <th>{t.action}</th>
            </tr>
          </thead>
          <tbody>
            {activePositions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {t.noPositions}
                </td>
              </tr>
            ) : (
              activePositions.map(pos => {
                const isPositiveUnrealized = pos.unrealizedPnL >= 0;
                const isPositiveRealized = pos.realizedPnL >= 0;
                const pnlPercent = pos.costBasis > 0 ? (pos.unrealizedPnL / pos.costBasis) * 100 : 0;

                return (
                  <tr key={pos.symbol}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {pos.symbol}
                    </td>

                    <td>
                      <div className="font-mono">
                        <span>{pos.quantity}</span>
                        {pos.reservedQuantity > 0 && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', marginLeft: '6px' }}>
                            ({pos.reservedQuantity} locked)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="font-mono text-secondary">
                      ${pos.averageEntryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>

                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      ${pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>

                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      ${pos.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td>
                      <span className={`badge ${isPositiveUnrealized ? 'badge-up' : 'badge-down'}`}>
                        {isPositiveUnrealized ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isPositiveUnrealized ? '+' : ''}${pos.unrealizedPnL.toFixed(2)} ({pnlPercent.toFixed(2)}%)
                      </span>
                    </td>

                    <td className="font-mono" style={{ color: isPositiveRealized ? 'var(--color-up)' : 'var(--color-down)' }}>
                      {isPositiveRealized ? '+' : ''}${pos.realizedPnL.toFixed(2)}
                    </td>

                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => onSelectSymbol(pos.symbol)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
