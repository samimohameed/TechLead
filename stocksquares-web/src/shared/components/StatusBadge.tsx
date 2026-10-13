import React from 'react';
import { OrderStatus, OrderSide } from '../dtos';
import { useTranslation } from '../i18n/I18nContext';

export const OrderStatusBadge: React.FC<{ status: OrderStatus | string }> = ({ status }) => {
  const { t } = useTranslation();
  const statusStr = typeof status === 'number'
    ? (status === 1 ? 'Pending' : status === 2 ? 'Filled' : status === 3 ? 'Cancelled' : 'Rejected')
    : status;

  switch (statusStr) {
    case 'Filled':
      return <span className="badge badge-filled">{t.statusFilled}</span>;
    case 'Pending':
      return <span className="badge badge-pending">{t.statusPending}</span>;
    case 'Cancelled':
      return <span className="badge badge-cancelled">{t.statusCancelled}</span>;
    case 'Rejected':
      return <span className="badge badge-down">{t.statusRejected}</span>;
    default:
      return <span className="badge badge-cancelled">{statusStr}</span>;
  }
};

export const OrderSideBadge: React.FC<{ side: OrderSide }> = ({ side }) => {
  const { t } = useTranslation();
  if (side === 1) {
    return <span className="badge badge-up" style={{ minWidth: '45px', justifyContent: 'center' }}>{t.buy}</span>;
  }
  return <span className="badge badge-down" style={{ minWidth: '45px', justifyContent: 'center' }}>{t.sell}</span>;
};
