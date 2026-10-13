import React from 'react';
import { TradeDto } from '../../shared/api/types';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { OrderSideBadge } from '../../shared/components/StatusBadge';
import { Zap } from 'lucide-react';

interface RecentTradesTableProps {
  trades: TradeDto[];
}

export const RecentTradesTable: React.FC<RecentTradesTableProps> = ({ trades }) => {
  const { t } = useTranslation();

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
            Recent Executions
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {trades.length} Fills
        </span>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.symbol}</th>
              <th>{t.side}</th>
              <th>{t.quantity}</th>
              <th>Fill Price</th>
              <th>Total Value</th>
              <th>{t.realizedPnl}</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No trade executions yet. Place a Market or Limit order to see fills.
                </td>
              </tr>
            ) : (
              trades.slice(0, 20).map(trade => {
                const hasPnl = trade.realizedPnL !== null && trade.realizedPnL !== undefined;
                const isPnlPositive = (trade.realizedPnL || 0) >= 0;

                return (
                  <tr key={trade.id}>
                    <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(trade.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {trade.symbol}
                    </td>

                    <td>
                      <OrderSideBadge side={trade.side} />
                    </td>

                    <td className="font-mono">
                      {trade.quantity}
                    </td>

                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>

                    <td className="font-mono text-secondary">
                      ${trade.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td>
                      {hasPnl ? (
                        <span className={`font-mono ${isPnlPositive ? 'text-up' : 'text-down'}`} style={{ fontWeight: 600 }}>
                          {isPnlPositive ? '+' : ''}${trade.realizedPnL!.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
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
