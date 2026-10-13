import React from 'react';
import { PositionDto, OrderSide } from '../../shared/dtos';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { formatDateTime } from '../../shared/utils/date.util';
import { Briefcase, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

interface PositionsTableProps {
  positions: PositionDto[];
  onSelectSymbol: (symbol: string) => void;
  onTradePosition?: (symbol: string, side: OrderSide, quantity?: number) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onSelectSymbol,
  onTradePosition
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
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            {t.positions}
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {activePositions.length} {t.activeHoldings}
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
              <th>{t.date}</th>
              <th>{t.action}</th>
            </tr>
          </thead>
          <tbody>
            {activePositions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
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
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      <span
                        onClick={() => onSelectSymbol(pos.symbol)}
                        style={{ cursor: 'pointer', color: 'var(--color-brand)' }}
                      >
                        {pos.symbol}
                      </span>
                    </td>

                    <td>
                      <div className="font-mono" style={{ fontWeight: 600 }}>
                        <span>{pos.quantity}</span>
                        {pos.reservedQuantity > 0 && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', marginInlineStart: '6px' }}>
                            ({pos.reservedQuantity} {t.locked})
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
                        <span className="font-mono">
                          {isPositiveUnrealized ? '+' : ''}${Math.abs(pos.unrealizedPnL).toFixed(2)} ({isPositiveUnrealized ? '+' : ''}{pnlPercent.toFixed(2)}%)
                        </span>
                      </span>
                    </td>

                    <td>
                      <span className="font-mono" style={{ color: isPositiveRealized ? 'var(--color-up)' : 'var(--color-down)', fontWeight: 600 }}>
                        {isPositiveRealized ? '+' : ''}${Math.abs(pos.realizedPnL).toFixed(2)}
                      </span>
                    </td>

                    <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                      {formatDateTime(pos.updatedAt)}
                    </td>

                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => {
                          if (onTradePosition) {
                            onTradePosition(pos.symbol, 2, pos.availableQuantity);
                          } else {
                            onSelectSymbol(pos.symbol);
                          }
                        }}
                        style={{ padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        {t.close}
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
