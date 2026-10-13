import React, { useState } from 'react';
import { OrderDto } from '../../shared/api/types';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { OrderStatusBadge, OrderSideBadge } from '../../shared/components/StatusBadge';
import { Clock, XCircle } from 'lucide-react';

interface OrderHistoryTableProps {
  orders: OrderDto[];
  onCancelOrder: (orderId: string) => Promise<void>;
  cancellingOrderId: string | null;
}

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({
  orders,
  onCancelOrder,
  cancellingOrderId
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'FILLED'>('ALL');

  const filteredOrders = orders.filter(o => {
    if (filter === 'PENDING') return o.status === 1;
    if (filter === 'FILLED') return o.status === 2;
    return true;
  });

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} style={{ color: 'var(--color-brand)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            {t.orderHistory}
          </h2>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['ALL', 'PENDING', 'FILLED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: filter === f ? 'var(--color-brand)' : 'var(--border-color)',
                background: filter === f ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.symbol}</th>
              <th>{t.side}</th>
              <th>{t.type}</th>
              <th>{t.quantity}</th>
              <th>{t.limitPrice}</th>
              <th>{t.price}</th>
              <th>{t.status}</th>
              <th>{t.action}</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {t.noOrders}
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const isPending = order.status === 1;
                const isCancelling = cancellingOrderId === order.id;

                return (
                  <tr key={order.id}>
                    <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {order.symbol}
                    </td>

                    <td>
                      <OrderSideBadge side={order.side} />
                    </td>

                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {order.type === 1 ? t.marketOrder : t.limitOrder}
                    </td>

                    <td className="font-mono">
                      {order.quantity}
                    </td>

                    <td className="font-mono text-secondary">
                      {order.limitPrice ? `$${order.limitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}
                    </td>

                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {order.filledPrice ? `$${order.filledPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}
                    </td>

                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>

                    <td>
                      {isPending ? (
                        <button
                          className="btn btn-ghost"
                          onClick={() => onCancelOrder(order.id)}
                          disabled={isCancelling}
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            color: 'var(--color-down)',
                            borderColor: 'rgba(244, 63, 94, 0.3)'
                          }}
                        >
                          <XCircle size={13} />
                          <span>{isCancelling ? t.cancelling : t.cancel}</span>
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
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
