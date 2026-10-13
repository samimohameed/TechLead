import React from 'react';
import { OrderStatus, OrderSide } from '../api/types';

export const OrderStatusBadge: React.FC<{ status: OrderStatus | string }> = ({ status }) => {
  // Can be numeric or string from SignalR
  const statusStr = typeof status === 'number'
    ? (status === 1 ? 'Pending' : status === 2 ? 'Filled' : status === 3 ? 'Cancelled' : 'Rejected')
    : status;

  switch (statusStr) {
    case 'Filled':
      return <span className="badge badge-filled">Filled</span>;
    case 'Pending':
      return <span className="badge badge-pending">Pending</span>;
    case 'Cancelled':
      return <span className="badge badge-cancelled">Cancelled</span>;
    case 'Rejected':
      return <span className="badge badge-down">Rejected</span>;
    default:
      return <span className="badge badge-cancelled">{statusStr}</span>;
  }
};

export const OrderSideBadge: React.FC<{ side: OrderSide }> = ({ side }) => {
  if (side === 1) {
    return <span className="badge badge-up" style={{ minWidth: '45px', justifyContent: 'center' }}>BUY</span>;
  }
  return <span className="badge badge-down" style={{ minWidth: '45px', justifyContent: 'center' }}>SELL</span>;
};
