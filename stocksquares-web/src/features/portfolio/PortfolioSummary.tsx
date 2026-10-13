import React from 'react';
import { PortfolioDto } from '../../shared/api/types';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { MetricCard } from '../../shared/components/MetricCard';
import { Wallet, DollarSign, TrendingUp, TrendingDown, Lock, PieChart } from 'lucide-react';

interface PortfolioSummaryProps {
  portfolio: PortfolioDto;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio }) => {
  const { t } = useTranslation();

  const isPositiveEquity = portfolio.totalReturnPercentage >= 0;
  const isPositiveRealized = portfolio.realizedPnl >= 0;
  const isPositiveUnrealized = portfolio.unrealizedPnl >= 0;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {/* Total Equity */}
      <MetricCard
        label={t.totalEquity}
        value={`$${portfolio.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subValue={`${isPositiveEquity ? '+' : ''}${portfolio.totalReturnPercentage.toFixed(2)}%`}
        trend={isPositiveEquity ? 'up' : 'down'}
        icon={<PieChart size={18} />}
      />

      {/* Available Cash */}
      <MetricCard
        label={t.availableCash}
        value={`$${portfolio.availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        subValue={portfolio.reservedCash > 0 ? `$${portfolio.reservedCash.toFixed(2)} locked` : undefined}
        trend="neutral"
        icon={<Wallet size={18} />}
      />

      {/* Reserved Cash */}
      <MetricCard
        label={t.reservedCash}
        value={`$${portfolio.reservedCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        trend="neutral"
        icon={<Lock size={18} />}
      />

      {/* Realized P&L */}
      <MetricCard
        label={t.realizedPnl}
        value={`${isPositiveRealized ? '+' : ''}$${portfolio.realizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        trend={isPositiveRealized ? 'up' : 'down'}
        icon={isPositiveRealized ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
      />

      {/* Unrealized P&L */}
      <MetricCard
        label={t.unrealizedPnl}
        value={`${isPositiveUnrealized ? '+' : ''}$${portfolio.unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        trend={isPositiveUnrealized ? 'up' : 'down'}
        icon={<DollarSign size={18} />}
      />
    </div>
  );
};
