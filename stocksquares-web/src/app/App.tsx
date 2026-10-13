import React, { useState, useEffect, useRef } from 'react';
import { api } from '../shared/api/client';
import { MarketDto, PortfolioDto, OrderDto, PlaceOrderRequest } from '../shared/api/types';
import { SignalRClient } from '../shared/realtime/signalrClient';
import { PriceUpdated, OrderUpdated, PortfolioUpdated, ConnectionState } from '../shared/realtime/types';
import { useTranslation } from '../shared/i18n/I18nContext';
import { useToast } from '../shared/components/Toast';
import { extractErrorMessage } from '../shared/utils/error.util';
import { environment } from '../environments/environment';
import { Navbar } from '../shared/components/Navbar';
import { PortfolioSummary } from '../features/portfolio/PortfolioSummary';
import { LivePriceTable } from '../features/markets/LivePriceTable';
import { PriceChart } from '../features/markets/PriceChart';
import { OrderTicket } from '../features/orders/OrderTicket';
import { PositionsTable } from '../features/portfolio/PositionsTable';
import { OrderHistoryTable } from '../features/orders/OrderHistoryTable';
import { RecentTradesTable } from '../features/portfolio/RecentTradesTable';

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
  const { showSuccess, showError, showInfo } = useToast();

  // State
  const [markets, setMarkets] = useState<Record<string, MarketDto>>({});
  const [tickFlashes, setTickFlashes] = useState<Record<string, 'up' | 'down'>>({});
  const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});
  const [portfolio, setPortfolio] = useState<PortfolioDto>(defaultPortfolio);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(environment.defaultSymbol);

  const [connectionState, setConnectionState] = useState<ConnectionState>('Disconnected');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'trades'>('positions');

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
      const historyMap: Record<string, number[]> = {};

      marketsData.forEach(m => {
        marketMap[m.symbol] = m;
        historyMap[m.symbol] = [m.price];
      });

      setMarkets(marketMap);
      setPriceHistory(historyMap);
      setPortfolio(portfolioData);
      setOrders(ordersData);

      if (marketsData.length > 0 && !selectedSymbol) {
        setSelectedSymbol(marketsData[0].symbol);
      }
    } catch (err: any) {
      console.error('Failed to load initial data snapshot:', err);
      const { message } = extractErrorMessage(err);
      showError('Connection Error', message);
    }
  };

  useEffect(() => {
    fetchInitialSnapshots();

    // Setup SignalR
    const client = new SignalRClient(environment.signalRHubUrl);
    signalRRef.current = client;

    client.setCallbacks(
      (state) => {
        setConnectionState(state);
        if (state === 'Connected') {
          showInfo('Live Feed Connected', 'Receiving real-time prices and order events.');
        }
      },
      () => {
        // After reconnecting, refresh snapshots as required
        console.log('SignalR reconnected, refreshing snapshots...');
        fetchInitialSnapshots();
        showInfo('Reconnected', 'Synchronized latest market and portfolio snapshots.');
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

        // Append to sparkline price history
        setPriceHistory(prev => {
          const current = prev[event.symbol] || [];
          const updated = [...current, event.price].slice(-40); // keep last 40 ticks
          return { ...prev, [event.symbol]: updated };
        });

        // Mark open positions with updated price & unrealized P&L
        setPortfolio(prev => {
          const updatedPositions = prev.positions.map(pos => {
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
        // Refresh orders & portfolio
        api.getOrders().then(setOrders).catch(console.error);
        api.getPortfolio().then(setPortfolio).catch(console.error);

        if (event.status === 'Filled') {
          showSuccess('Order Filled!', `Order ${event.orderId.substring(0, 8)} has executed against the market.`);
        }
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
    try {
      const order = await api.placeOrder(req);
      const [p, o] = await Promise.all([api.getPortfolio(), api.getOrders()]);
      setPortfolio(p);
      setOrders(o);

      if (order.status === 2) { // Filled
        showSuccess(t.orderPlacedSuccess, `${req.side === 1 ? 'Bought' : 'Sold'} ${req.quantity} ${req.symbol} @ $${order.filledPrice}`);
      } else {
        showInfo('Limit Order Queued', `Limit order submitted at $${req.limitPrice}. Waiting for market price to reach limit.`);
      }
    } catch (err: any) {
      const { message } = extractErrorMessage(err);
      showError('Order Failed', message);
      throw err;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await api.cancelOrder(orderId);
      const [p, o] = await Promise.all([api.getPortfolio(), api.getOrders()]);
      setPortfolio(p);
      setOrders(o);
      showSuccess(t.orderCancelledSuccess, 'Reserved balance refunded.');
    } catch (err: any) {
      const { message } = extractErrorMessage(err);
      showError('Cancellation Failed', message);
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
      showSuccess('Portfolio Reset', 'Virtual balance restored to $50,000.00 cash.');
    } catch (err: any) {
      const { message } = extractErrorMessage(err);
      showError('Reset Failed', message);
    } finally {
      setIsResetting(false);
    }
  };

  const currentHistory = priceHistory[selectedSymbol] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: '20px' }}>
      <Navbar
        connectionState={connectionState}
        onResetPortfolio={handleResetPortfolio}
        isResetting={isResetting}
      />

      <main style={{ padding: '0 24px 40px 24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Live Chart for selected symbol */}
            <PriceChart
              symbol={selectedSymbol}
              market={markets[selectedSymbol]}
              priceHistory={currentHistory}
            />

            {/* Markets Table */}
            <LivePriceTable
              markets={markets}
              tickFlashes={tickFlashes}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
            />

            {/* Tabs for Positions, Orders, and Executions */}
            <div className="glass-panel" style={{ padding: '8px', display: 'flex', gap: '8px', width: 'fit-content' }}>
              <button
                className={`btn ${activeTab === 'positions' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('positions')}
                style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
              >
                {t.positions} ({portfolio.positions.filter(p => p.quantity > 0).length})
              </button>
              <button
                className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('orders')}
                style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
              >
                {t.orderHistory} ({orders.length})
              </button>
              <button
                className={`btn ${activeTab === 'trades' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('trades')}
                style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
              >
                Recent Executions ({portfolio.recentTrades?.length || 0})
              </button>
            </div>

            {/* Tab content view */}
            {activeTab === 'positions' && (
              <PositionsTable
                positions={portfolio.positions}
                onSelectSymbol={setSelectedSymbol}
              />
            )}

            {activeTab === 'orders' && (
              <OrderHistoryTable
                orders={orders}
                onCancelOrder={handleCancelOrder}
                cancellingOrderId={cancellingOrderId}
              />
            )}

            {activeTab === 'trades' && (
              <RecentTradesTable
                trades={portfolio.recentTrades || []}
              />
            )}
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
