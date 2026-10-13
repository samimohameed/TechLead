import React, { useState, useEffect } from 'react';
import { MarketDto, OrderType, OrderSide, PlaceOrderRequest, PortfolioDto } from '../../shared/dtos';
import { useTranslation } from '../../shared/i18n/I18nContext';
import { normalizeInputNumber } from '../../shared/utils/number.util';
import {
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface OrderTicketProps {
  selectedSymbol: string;
  market?: MarketDto;
  portfolio: PortfolioDto;
  onPlaceOrder: (req: PlaceOrderRequest) => Promise<void>;
  isSubmitting: boolean;
  initialSide?: OrderSide;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  selectedSymbol,
  market,
  portfolio,
  onPlaceOrder,
  isSubmitting,
  initialSide = 1
}) => {
  const { t } = useTranslation();

  const [side, setSide] = useState<OrderSide>(initialSide);
  const [type, setType] = useState<OrderType>(1);
  const [quantity, setQuantity] = useState<string>('0.1');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSide) {
      setSide(initialSide);
    }
  }, [initialSide]);

  // When selected market changes or initial load, pre-populate limit price
  useEffect(() => {
    if (market?.price) {
      setLimitPrice(market.price.toFixed(2));
    }
  }, [market?.symbol]);

  const currentPrice = market?.price || 0;
  const cleanSymbol = selectedSymbol.replace('USDT', '');

  // Normalized numbers
  const cleanQty = normalizeInputNumber(quantity);
  const cleanLimit = normalizeInputNumber(limitPrice);
  const numQuantity = parseFloat(cleanQty) || 0;
  const numLimitPrice = parseFloat(cleanLimit) || 0;

  const effectivePrice = type === 2 ? (numLimitPrice > 0 ? numLimitPrice : currentPrice) : currentPrice;
  const estimatedTotal = numQuantity * effectivePrice;

  // Find owned position for this symbol
  const currentPosition = portfolio.positions.find(
    p => p.symbol.toUpperCase() === selectedSymbol.toUpperCase()
  );
  const currentHoldingQty = currentPosition?.quantity || 0;
  const availablePositionQty = currentPosition?.availableQuantity || 0;
  const lockedPositionQty = currentPosition?.reservedQuantity || 0;

  // Max calculations
  const maxAffordableQty = effectivePrice > 0 ? Math.floor((portfolio.availableCash / effectivePrice) * 10000) / 10000 : 0;
  const maxAvailableUnits = side === 1 ? maxAffordableQty : availablePositionQty;

  // Projected position after trade
  const projectedHoldingQty = side === 1
    ? currentHoldingQty + numQuantity
    : Math.max(0, currentHoldingQty - numQuantity);

  // Realtime validation
  useEffect(() => {
    setValidationError(null);
    setSubmitError(null);

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
        setValidationError(`${t.insufficientFunds} ($${estimatedTotal.toFixed(2)} > $${portfolio.availableCash.toFixed(2)})`);
      }
    } else { // Sell
      if (numQuantity > availablePositionQty) {
        setValidationError(`${t.insufficientQuantity} (${numQuantity} > ${availablePositionQty})`);
      }
    }
  }, [side, type, quantity, limitPrice, currentPrice, portfolio.availableCash, availablePositionQty]);

  const handleQuickPercent = (pct: number) => {
    if (side === 1) { // Buy based on available cash
      if (effectivePrice <= 0) return;
      const budget = portfolio.availableCash * pct;
      const maxUnits = Math.floor((budget / effectivePrice) * 10000) / 10000;
      setQuantity(maxUnits > 0 ? maxUnits.toString() : '0');
    } else { // Sell based on owned quantity
      const units = Math.floor((availablePositionQty * pct) * 10000) / 10000;
      setQuantity(units > 0 ? units.toString() : '0');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError || numQuantity <= 0 || isSubmitting) return;

    setSubmitError(null);
    setSuccessMsg(null);

    try {
      await onPlaceOrder({
        symbol: selectedSymbol,
        type,
        side,
        quantity: numQuantity,
        limitPrice: type === 2 ? numLimitPrice : undefined
      });
      const actionText = side === 1 ? t.buy : t.sell;
      setSuccessMsg(`${t.orderPlacedSuccess} (${actionText} ${numQuantity} ${cleanSymbol} • ${t.projectedPosition}: ${projectedHoldingQty.toFixed(4)} ${cleanSymbol})`);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setSubmitError(err.message || t.orderFailedTitle);
    }
  };

  const isFormValid = !validationError && numQuantity > 0 && !isSubmitting;

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={18} style={{ color: 'var(--color-brand)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
            {t.orderTicket}
          </h2>
        </div>
        <span className="font-mono" style={{
          fontSize: '0.8125rem',
          fontWeight: 700,
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          {selectedSymbol}
        </span>
      </div>

      {/* Buy / Sell Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setSide(1)}
          className={`btn ${side === 1 ? 'btn-buy' : 'btn-ghost'}`}
          style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '10px', fontSize: '0.875rem' }}
        >
          {t.buy}
        </button>
        <button
          type="button"
          onClick={() => setSide(2)}
          className={`btn ${side === 2 ? 'btn-sell' : 'btn-ghost'}`}
          style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '10px', fontSize: '0.875rem' }}
        >
          {t.sell}
        </button>
      </div>

      {/* Order Type Toggle (Market vs Limit) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={() => setType(1)}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid',
            borderColor: type === 1 ? 'var(--color-brand)' : 'var(--border-color)',
            background: type === 1 ? 'rgba(59, 130, 246, 0.16)' : 'transparent',
            color: type === 1 ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
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
            background: type === 2 ? 'rgba(59, 130, 246, 0.16)' : 'transparent',
            color: type === 2 ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {t.limitOrder}
        </button>
      </div>

      {/* Detailed Position & Quantity Clarity Card */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.75rem',
        marginBottom: '14px'
      }}>
        {/* Current Holding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{t.currentPosition}:</span>
          <bdi dir="ltr" className="font-mono" style={{ fontWeight: 700, color: currentHoldingQty > 0 ? 'var(--color-up)' : 'var(--text-muted)' }}>
            {currentHoldingQty.toFixed(4)} {cleanSymbol} {currentHoldingQty > 0 && `(~$${(currentHoldingQty * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`}
          </bdi>
        </div>

        {/* Available to trade */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {side === 1 ? t.maxBuy : t.availableToSell}:
          </span>
          <bdi dir="ltr" className="font-mono text-secondary">
            {side === 1 ? (
              <>{maxAffordableQty.toFixed(4)} {cleanSymbol} (${portfolio.availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</>
            ) : (
              <>{availablePositionQty.toFixed(4)} {cleanSymbol} {lockedPositionQty > 0 ? `(${lockedPositionQty.toFixed(4)} ${t.locked})` : ''}</>
            )}
          </bdi>
        </div>

        {/* Projected balance after trade */}
        {numQuantity > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '6px',
            marginTop: '2px',
            borderTop: '1px dashed rgba(255, 255, 255, 0.08)'
          }}>
            <span style={{ color: side === 1 ? 'var(--color-up)' : 'var(--color-warning)', fontWeight: 600 }}>
              {t.projectedPosition}:
            </span>
            <bdi dir="ltr" className="font-mono" style={{ fontWeight: 800, color: '#fff' }}>
              {projectedHoldingQty.toFixed(4)} {cleanSymbol} (~${(projectedHoldingQty * currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </bdi>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Quantity Field */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.75rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t.quantity}</label>
            <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span>{t.max}:</span>
              <bdi className="font-mono" dir="ltr" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {maxAvailableUnits.toFixed(4)} {cleanSymbol}
              </bdi>
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0 12px',
            transition: 'border-color 0.2s'
          }}>
            <input
              type="text"
              inputMode="decimal"
              className="font-mono"
              value={quantity}
              onChange={e => setQuantity(normalizeInputNumber(e.target.value))}
              placeholder="0.00"
              required
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                padding: '10px 0',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                fontWeight: 600
              }}
            />
            <span className="font-mono" style={{
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 700,
              paddingInlineStart: '8px',
              userSelect: 'none'
            }}>
              {cleanSymbol}
            </span>
          </div>

          {/* Quick % buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '6px' }}>
            {[0.25, 0.5, 0.75, 1.0].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuickPercent(pct)}
                className="btn btn-ghost"
                style={{ padding: '4px', fontSize: '0.6875rem', fontWeight: 600 }}
              >
                {pct === 1.0 ? t.max : `${pct * 100}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Limit Price Field (shown if Limit order) */}
        {type === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '0.75rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t.limitPrice} (USD)</label>
              <span className="font-mono text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>{t.currentPrice}:</span>
                <bdi dir="ltr">${currentPrice.toFixed(2)}</bdi>
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0 12px',
              transition: 'border-color 0.2s'
            }}>
              <input
                type="text"
                inputMode="decimal"
                className="font-mono"
                value={limitPrice}
                onChange={e => setLimitPrice(normalizeInputNumber(e.target.value))}
                placeholder="0.00"
                required
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '10px 0',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  fontWeight: 600
                }}
              />
              <span className="font-mono" style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 700,
                paddingInlineStart: '8px',
                userSelect: 'none'
              }}>
                USD
              </span>
            </div>
          </div>
        )}

        {/* Summary breakdown */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t.estTotal}</span>
            <bdi dir="ltr" className="font-mono" style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff' }}>
              ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </bdi>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t.availableCash}</span>
            <bdi dir="ltr" className="font-mono text-secondary">
              ${portfolio.availableCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </bdi>
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'var(--color-down-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-down)',
            fontSize: '0.75rem'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Server Submit Error Banner */}
        {submitError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'var(--color-down-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-down)',
            fontSize: '0.75rem'
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Success Confirmation */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'var(--color-up-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-up)',
            fontSize: '0.75rem'
          }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button with Explicit Quantity & Dollar Value */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`btn ${side === 1 ? 'btn-buy' : 'btn-sell'}`}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '2px',
            fontSize: '0.875rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)'
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {t.placing}
            </>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
              <span>{side === 1 ? t.buy : t.sell}</span>
              <bdi className="font-mono" dir="ltr">{numQuantity > 0 ? `${numQuantity} ${cleanSymbol}` : selectedSymbol}</bdi>
              <bdi className="font-mono" dir="ltr">(${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</bdi>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};
