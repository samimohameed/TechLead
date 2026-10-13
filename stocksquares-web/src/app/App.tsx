import React, { useState, useEffect, useRef } from 'react';
import { api, SIGNALR_URL } from '../shared/api/client';
import { MarketDto, PortfolioDto, OrderDto, PlaceOrderRequest } from '../shared/api/types';
import { SignalRClient } from '../shared/realtime/signalrClient';
import { PriceUpdated, OrderUpdated, PortfolioUpdated, ConnectionState } from '../shared/realtime/types';
import { useTranslation } from '../shared/i18n/I18nContext';
import { Navbar } from '../shared/components/Navbar';
import { PortfolioSummary } from '../features/portfolio/PortfolioSummary';
import { LivePriceTable } from '../features/markets/LivePriceTable';
import { OrderTicket } from '../features/orders/OrderTicket';
import { PositionsTable } from '../features/portfolio/PositionsTable';
import { OrderHistoryTable } from '../features/orders/OrderHistoryTable';

const defaultPortfolio: PortfolioDto = {
  id: '',
  userId: 'trader-1',
  availableCash: 50000,
  reservedCash: 0,
  totalCash: 50000,
  totalEquity: 50000,
  realizedPnl: 0,
  unrealizedPnl: 0,
  totalReturnPercentage: 0,
  positions: [],
  recentTrades: []
};

export const App: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [markets, setMarkets] = useState<Record<string, MarketDto>>({});
  const [tickFlashes, setTickFlashes] = useState<Record<string, 'up' | 'down'>>({});
  const [portfolio, setPortfolio] = useState<PortfolioDto>(defaultPortfolio);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');

  const [connectionState, setConnectionState] = useState<ConnectionState>('Disconnected');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const signalRRef = useRef<SignalRClient | null>(null);

  // Initial Snapshot fetch
  const fetchInitialSnapshots = async () => {
    try {
      const [marketsData, portfolioData, ordersData] = await Promise.all([
        api.getMarkets(),
        api.getPortfolio(),
        api.getOrders()
      ]);

      const marketMap: Record<string, MarketDto> = {};
      marketsData.forEach(m => { marketMap[m.symbol] = m; });

      setMarkets(marketMap);
      setPortfolio(portfolioData);
      setOrders(ordersData);

      if (marketsData.length > 0 && !selectedSymbol) {
        setSelectedSymbol(marketsData[0].symbol);
      }
    } catch (err: any) {
      console.error('Failed to load initial data snapshot:', err);
      setGlobalError(err.message || 'Failed to connect to API backend');
    }
  };

  useEffect(() => {
    fetchInitialSnapshots();

    // Setup SignalR
    const client = new SignalRClient(SIGNALR_URL);
    signalRRef.current = client;

    client.setCallbacks(
      (state) => setConnectionState(state),
      () => {
        // After reconnecting, refresh snapshots
        console.log('SignalR reconnected, refreshing snapshots...');
        fetchInitialSnapshots();
      }
    );

    client.start(
      // On PriceUpdated
      (event: PriceUpdated) => {
        setMarkets(prev => {
          const old = prev[event.symbol];
          const newPrice = event.price;
          const direction: 'up' | 'down' = old ? (newPrice >= old.price ? 'up' : 'down') : 'up';

          setTickFlashes(f => ({ ...f, [event.symbol]: direction }));
          setTimeout(() => {
            setTickFlashes(f => {
              const copy = { ...f };
              delete copy[event.symbol];
              return copy;
            });
          }, 800);

          return {
            ...prev,
            [event.symbol]: {
              symbol: event.symbol,
              price: newPrice,
              change24h: old ? old.change24h : 0,
              high24h: old ? Math.max(old.high24h, newPrice) : newPrice,
              low24h: old ? Math.min(old.low24h, newPrice) : newPrice,
              volume24h: old ? old.volume24h : 1000,
              timestamp: event.timestamp,
              source: event.source
            }
          };
        });

        // Mark open positions with updated price & unrealized P&L
        setPortfolio(prev => {
          let updatedPositions = prev.positions.map(pos => {
            if (pos.symbol.toUpperCase() === event.symbol.toUpperCase() && pos.quantity > 0) {
              const currentPrice = event.price;
              const marketValue = pos.quantity * currentPrice;
              const unrealizedPnL = (currentPrice - pos.averageEntryPrice) * pos.quantity;
              return {
                ...pos,
                currentPrice,
                marketValue,
                unrealizedPnL
              };
            }
            return pos;
          });

          const totalPositionValue = updatedPositions.reduce((sum, p) => sum + p.marketValue, 0);
          const totalUnrealizedPnL = updatedPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
          const totalEquity = prev.totalCash + totalPositionValue;
          const initial = 50000;
          const totalReturnPercentage = initial > 0 ? ((totalEquity - initial) / initial) * 100 : 0;

          return {
            ...prev,
            positions: updatedPositions,
            totalEquity,
            unrealizedPnl: totalUnrealizedPnL,
            totalReturnPercentage
          };
        });
      },

      // On OrderUpdated
      (event: OrderUpdated) => {
        // Refresh orders & portfolio to get consistent server-calculated state
        api.getOrders().then(setOrders).catch(console.error);
        api.getPortfolio().then(setPortfolio).catch(console.error);
      },

      // On PortfolioUpdated
      (event: PortfolioUpdated) => {
        setPortfolio(prev => ({
          ...prev,
          availableCash: event.availableCash,
          realizedPnl: event.realizedPnl,
          unrealizedPnl: event.unrealizedPnl,
          totalCash: event.availableCash + prev.reservedCash,
          totalEquity: event.availableCash + prev.reservedCash + prev.positions.reduce((sum, p) => sum + p.marketValue, 0)
        }));
      }
    );

    return () => {
      client.stop();
    };
  }, []);

  // Handlers
  const handlePlaceOrder = async (req: PlaceOrderRequest) => {
    setIsSubmittingOrder(true);
    setGlobalError(null);
    try {
      await api.placeOrder(req);
      // Refresh state
      const [p, o] = await Promise.all([api.getPortfolio(), api.getOrders()]);
      setPortfolio(p);
      setOrders(o);
    } catch (err: any) {
      setGlobalError(err.message || 'Order failed');
      throw err;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    setGlobalError(null);
    try {
      await api.cancelOrder(orderId);
      const [p, o] = await Promise.all([api.getPortfolio(), api.getOrders()]);
      setPortfolio(p);
      setOrders(o);
    } catch (err: any) {
      setGlobalError(err.message || 'Cancellation failed');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleResetPortfolio = async () => {
    if (!window.confirm('Reset virtual portfolio to initial $50,000 cash balance?')) return;
    setIsResetting(true);
    try {
      const p = await api.resetPortfolio();
      const o = await api.getOrders();
      setPortfolio(p);
      setOrders(o);
    } catch (err: any) {
      setGlobalError(err.message || 'Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: '20px' }}>
      <Navbar
        connectionState={connectionState}
        onResetPortfolio={handleResetPortfolio}
        isResetting={isResetting}
      />

      <main style={{ padding: '0 24px 40px 24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Global Error Banner */}
        {globalError && (
          <div style={{
            background: 'var(--color-down-bg)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: 'var(--color-down)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{globalError}</span>
            <button
              onClick={() => setGlobalError(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Portfolio Summary Metrics */}
        <PortfolioSummary portfolio={portfolio} />

        {/* Trading Dashboard Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <LivePriceTable
              markets={markets}
              tickFlashes={tickFlashes}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
            />

            <PositionsTable
              positions={portfolio.positions}
              onSelectSymbol={setSelectedSymbol}
            />

            <OrderHistoryTable
              orders={orders}
              onCancelOrder={handleCancelOrder}
              cancellingOrderId={cancellingOrderId}
            />
          </div>

          {/* Sticky Order Ticket */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <OrderTicket
              selectedSymbol={selectedSymbol}
              market={markets[selectedSymbol]}
              portfolio={portfolio}
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmittingOrder}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
