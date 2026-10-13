import React from 'react';
import { TradeDto } from '../../shared/dtos';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { OrderSideBadge } from '../../shared/components/StatusBadge';
import { formatDateTime } from '../../shared/utils/date.util';
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
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            {t.recentTrades}
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {trades.length} {t.fills}
        </span>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.symbol}</th>
              <th>{t.side}</th>
              <th>{t.quantity}</th>
              <th>{t.price}</th>
              <th>{t.marketValue}</th>
              <th>{t.realizedPnl}</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {t.noTrades}
                </td>
              </tr>
            ) : (
              trades.map(trade => {
                const hasPnl = trade.realizedPnL !== null && trade.realizedPnL !== undefined;
                const isPnlPositive = (trade.realizedPnL || 0) >= 0;

                return (
                  <tr key={trade.id}>
                    <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                      {formatDateTime(trade.executedAt)}
                    </td>

                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      {trade.symbol}
                    </td>

                    <td>
                      <OrderSideBadge side={trade.side} />
                    </td>

                    <td className="font-mono" style={{ fontWeight: 600 }}>
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
                        <span className="font-mono" style={{
                          fontWeight: 700,
                          color: isPnlPositive ? 'var(--color-up)' : 'var(--color-down)'
                        }}>
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
