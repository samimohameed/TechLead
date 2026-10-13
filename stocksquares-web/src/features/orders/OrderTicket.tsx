import React, { useState, useEffect } from 'react';
import { MarketDto, OrderType, OrderSide, PlaceOrderRequest, PortfolioDto } from '../../shared/api/types';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OrderTicketProps {
  selectedSymbol: string;
  market?: MarketDto;
  portfolio: PortfolioDto;
  onPlaceOrder: (req: PlaceOrderRequest) => Promise<void>;
  isSubmitting: boolean;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  selectedSymbol,
  market,
  portfolio,
  onPlaceOrder,
  isSubmitting
}) => {
  const { t } = useTranslation();

  const [side, setSide] = useState<OrderSide>(1); // 1 = Buy, 2 = Sell
  const [type, setType] = useState<OrderType>(1); // 1 = Market, 2 = Limit
  const [quantity, setQuantity] = useState<string>('0.1');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // When selected market changes or initial load, pre-populate limit price
  useEffect(() => {
    if (market?.price) {
      setLimitPrice(market.price.toString());
    }
  }, [market?.symbol]);

  const currentPrice = market?.price || 0;
  const numQuantity = parseFloat(quantity) || 0;
  const numLimitPrice = parseFloat(limitPrice) || 0;

  const effectivePrice = type === 2 ? numLimitPrice : currentPrice;
  const estimatedTotal = numQuantity * effectivePrice;

  // Find owned position for this symbol
  const currentPosition = portfolio.positions.find(
    p => p.symbol.toUpperCase() === selectedSymbol.toUpperCase()
  );
  const availablePositionQty = currentPosition?.availableQuantity || 0;

  // Validation logic
  useEffect(() => {
    setValidationError(null);

    if (numQuantity <= 0) {
      setValidationError(t.invalidQuantity);
      return;
    }

    if (type === 2 && numLimitPrice <= 0) {
      setValidationError(t.invalidLimitPrice);
      return;
    }

    if (side === 1) { // Buy
      if (estimatedTotal > portfolio.availableCash) {
        setValidationError(t.insufficientFunds);
      }
    } else { // Sell
      if (numQuantity > availablePositionQty) {
        setValidationError(t.insufficientQuantity);
      }
    }
  }, [side, type, quantity, limitPrice, currentPrice, portfolio.availableCash, availablePositionQty]);

  const handleQuickPercent = (pct: number) => {
    if (side === 1) { // Buy based on available cash
      if (effectivePrice <= 0) return;
      const budget = portfolio.availableCash * pct;
      const calculatedQty = (budget / effectivePrice).toFixed(4);
      setQuantity(calculatedQty);
    } else { // Sell based on owned quantity
      const calculatedQty = (availablePositionQty * pct).toFixed(4);
      setQuantity(calculatedQty);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || numQuantity <= 0) return;

    try {
      setSuccessMsg(null);
      await onPlaceOrder({
        symbol: selectedSymbol,
        type,
        side,
        quantity: numQuantity,
        limitPrice: type === 2 ? numLimitPrice : undefined
      });
      setSuccessMsg(t.orderPlacedSuccess);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      // Error is caught and displayed via alert/toast
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={18} style={{ color: 'var(--color-brand)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            {t.orderTicket}
          </h2>
        </div>
        <span className="font-mono" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
          {selectedSymbol}
        </span>
      </div>

      {/* Buy / Sell Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setSide(1)}
          className={`btn ${side === 1 ? 'btn-buy' : 'btn-ghost'}`}
          style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
        >
          {t.buy}
        </button>
        <button
          type="button"
          onClick={() => setSide(2)}
          className={`btn ${side === 2 ? 'btn-sell' : 'btn-ghost'}`}
          style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
        >
          {t.sell}
        </button>
      </div>

      {/* Order Type Toggle (Market vs Limit) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setType(1)}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid',
            borderColor: type === 1 ? 'var(--color-brand)' : 'var(--border-color)',
            background: type === 1 ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: type === 1 ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t.marketOrder}
        </button>
        <button
          type="button"
          onClick={() => setType(2)}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid',
            borderColor: type === 2 ? 'var(--color-brand)' : 'var(--border-color)',
            background: type === 2 ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: type === 2 ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t.limitOrder}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Quantity Field */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.quantity}</label>
            <span style={{ color: 'var(--text-muted)' }}>
              {side === 2 ? `Holding: ${availablePositionQty} ${selectedSymbol}` : `Max: ${(portfolio.availableCash / (effectivePrice || 1)).toFixed(4)}`}
            </span>
          </div>
          <input
            type="number"
            step="any"
            className="input-field font-mono"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="0.00"
            required
          />

          {/* Quick % buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
            {[0.25, 0.5, 0.75, 1.0].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuickPercent(pct)}
                className="btn btn-ghost"
                style={{ padding: '4px', fontSize: '0.6875rem' }}
              >
                {pct === 1.0 ? t.max : `${pct * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Limit Price Field (shown if Limit order) */}
        {type === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{t.limitPrice} (USD)</label>
              <span className="font-mono text-muted">
                Current: ${currentPrice.toFixed(2)}
              </span>
            </div>
            <input
              type="number"
              step="any"
              className="input-field font-mono"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        )}

        {/* Summary breakdown */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.8125rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t.estTotal}</span>
            <span className="font-mono" style={{ fontWeight: 700 }}>
              ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.availableCash}</span>
            <span className="font-mono text-secondary">
              ${portfolio.availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'var(--color-down-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-down)',
            fontSize: '0.75rem'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Success Confirmation */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'var(--color-up-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-up)',
            fontSize: '0.75rem'
          }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !!validationError || numQuantity <= 0}
          className={`btn ${side === 1 ? 'btn-buy' : 'btn-sell'}`}
          style={{ width: '100%', padding: '12px', marginTop: '4px' }}
        >
          {isSubmitting ? t.placing : `${side === 1 ? t.buy : t.sell} ${selectedSymbol}`}
        </button>
      </form>
    </div>
  );
};
