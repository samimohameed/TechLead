import React, { useState, useEffect } from 'react';
import { forkJoin, firstValueFrom, Subscription } from 'rxjs';
import { marketsService, ordersService, portfolioService, realtimeService } from '../shared/services';
import { MarketDto, PortfolioDto, OrderDto, PlaceOrderRequest, OrderSide, ConnectionState, OrderUpdated, PortfolioUpdated } from '../shared/dtos';
import { useTranslation } from '../shared/i18n/I18nContext';
import { useToast } from '../shared/components/Toast';
import { extractErrorMessage } from '../shared/utils/error.util';
import { environment } from '../environments/environment';
import { Navbar } from '../shared/components/Navbar';
import { PortfolioSummary } from '../features/portfolio/PortfolioSummary';
import { LivePriceTable } from '../features/markets/LivePriceTable';
import { PriceChart, PriceTickHistoryItem } from '../features/markets/PriceChart';
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
  const [priceHistory, setPriceHistory] = useState<Record<string, PriceTickHistoryItem[]>>({});
  const [portfolio, setPortfolio] = useState<PortfolioDto>(defaultPortfolio);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(environment.defaultSymbol);
  const [ticketSide, setTicketSide] = useState<OrderSide>(1);

  const [connectionState, setConnectionState] = useState<ConnectionState>('Disconnected');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'openOrders' | 'orders' | 'trades'>('positions');

  // Initial Snapshot fetch via RxJS Observable streams
  const fetchInitialSnapshots = () => {
    forkJoin({
      marketsData: marketsService.getMarkets(),
      portfolioData: portfolioService.getPortfolio(),
      ordersData: ordersService.getOrdersList()
    }).subscribe({
      next: ({ marketsData, portfolioData, ordersData }) => {
        const marketMap: Record<string, MarketDto> = {};
        const historyMap: Record<string, PriceTickHistoryItem[]> = {};

        const now = Date.now();
        marketsData.forEach(m => {
          marketMap[m.symbol] = m;
          const base = m.price;
          const points: PriceTickHistoryItem[] = [];
          // Pre-populate 20 historical ticks preceding the current snapshot so chart has real timestamps and dates
          for (let i = 20; i >= 1; i--) {
            const time = now - i * 10000;
            const variance = (Math.sin(i / 2) * 0.0006 + (Math.random() - 0.5) * 0.0004) * base;
            points.push({ timestamp: time, price: Number((base + variance).toFixed(4)) });
          }
          points.push({ timestamp: now, price: base });
          historyMap[m.symbol] = points;
        });

        setMarkets(marketMap);
        setPriceHistory(historyMap);
        setPortfolio(portfolioData);
        setOrders(ordersData);

        if (marketsData.length > 0 && !selectedSymbol) {
          setSelectedSymbol(marketsData[0].symbol);
        }
      },
      error: (err: any) => {
        console.error('Failed to load initial data snapshot:', err);
        const { message } = extractErrorMessage(err);
        showError(t.connectionErrorTitle, message);
      }
    });
  };

  useEffect(() => {
    fetchInitialSnapshots();

    realtimeService.connect();

    const sub = new Subscription();

    sub.add(
      realtimeService.connectionState$.subscribe(state => {
        setConnectionState(state);
        if (state === 'Connected') {
          showInfo(t.liveFeedConnectedTitle, t.liveFeedConnectedMsg);
        }
      })
    );

    sub.add(
      realtimeService.reconnected$.subscribe(() => {
        console.log('SignalR reconnected, refreshing snapshots...');
        fetchInitialSnapshots();
        showInfo(t.reconnectedTitle, t.reconnectedMsg);
      })
    );

    sub.add(
      realtimeService.price$.subscribe(event => {
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

        // Append to timestamped price history
        setPriceHistory(prev => {
          const current = prev[event.symbol] || [];
          const tickTime = event.timestamp ? new Date(event.timestamp).getTime() : Date.now();
          const updated = [...current, { timestamp: tickTime, price: event.price }].slice(-120);
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
      })
    );

    // On OrderUpdated
    sub.add(
      realtimeService.order$.subscribe((event: OrderUpdated) => {
        forkJoin({
          orders: ordersService.getOrdersList(),
          portfolio: portfolioService.getPortfolio()
        }).subscribe({
          next: ({ orders: o, portfolio: p }) => {
            setOrders(o);
            setPortfolio(p);
          },
          error: console.error
        });

        if (event.status === 'Filled') {
          showSuccess(t.orderFilledTitle, `${t.orderExecutedAgainstMarket} (${event.orderId.substring(0, 8)})`);
        }
      })
    );

    // On PortfolioUpdated
    sub.add(
      realtimeService.portfolio$.subscribe((event: PortfolioUpdated) => {
        setPortfolio(prev => ({
          ...prev,
          availableCash: event.availableCash,
          realizedPnl: event.realizedPnl,
          unrealizedPnl: event.unrealizedPnl,
          totalCash: event.availableCash + prev.reservedCash,
          totalEquity: event.availableCash + prev.reservedCash + prev.positions.reduce((sum, p) => sum + p.marketValue, 0)
        }));
      })
    );

    return () => {
      sub.unsubscribe();
      realtimeService.disconnect();
    };
  }, []);

  // Handlers
  const handlePlaceOrder = async (req: PlaceOrderRequest) => {
    setIsSubmittingOrder(true);
    try {
      const order = await firstValueFrom(ordersService.placeOrder(req));
      const { portfolio: p, orders: o } = await firstValueFrom(
        forkJoin({
          portfolio: portfolioService.getPortfolio(),
          orders: ordersService.getOrdersList()
        })
      );
      setPortfolio(p);
      setOrders(o);

      if (order.status === 2) { // Filled
        showSuccess(t.orderPlacedSuccess, `${req.side === 1 ? t.boughtAction : t.soldAction} ${req.quantity} ${req.symbol} @ $${order.filledPrice}`);
      } else {
        showInfo(t.limitQueuedTitle, t.limitQueuedMsg);
      }
    } catch (err: any) {
      const { message } = extractErrorMessage(err);
      showError(t.orderFailedTitle, message);
      throw err;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);
    try {
      await firstValueFrom(ordersService.cancelOrder(orderId));
      const { portfolio: p, orders: o } = await firstValueFrom(
        forkJoin({
          portfolio: portfolioService.getPortfolio(),
          orders: ordersService.getOrdersList()
        })
      );
      setPortfolio(p);
      setOrders(o);
      showSuccess(t.orderCancelledSuccess, t.refundedBalanceMsg);
    } catch (err: any) {
      const { message } = extractErrorMessage(err);
      showError(t.cancellationFailedTitle, message);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleResetPortfolio = async () => {
    if (!window.confirm(t.resetConfirmPrompt)) return;
    setIsResetting(true);
    try {
      const { portfolio: p, orders: o } = await firstValueFrom(
        forkJoin({
          portfolio: portfolioService.resetPortfolio(),
          orders: ordersService.getOrdersList()
        })
      );
      setPortfolio(p);
      setOrders(o);
      showSuccess(t.resetSuccessTitle, t.resetSuccessMsg);
    } catch (err: any) {
      const { message } = extractErrorMessage(err);
      showError(t.resetFailedTitle, message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleTradePosition = (symbol: string, side: OrderSide) => {
    setSelectedSymbol(symbol);
    setTicketSide(side);
    // Smooth scroll to top/order ticket if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentHistory = priceHistory[selectedSymbol] || [];
  const openOrdersCount = orders.filter(o => o.status === 1).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: '20px' }}>
      <Navbar
        connectionState={connectionState}
        onResetPortfolio={handleResetPortfolio}
        isResetting={isResetting}
        onReconnect={() => realtimeService.connect()}
      />

      <main style={{ padding: '0 24px 48px 24px', maxWidth: '1480px', width: '100%', margin: '0 auto' }}>
        {/* Portfolio Summary Metrics Bar */}
        <PortfolioSummary portfolio={portfolio} />

        {/* Main Trading Terminal Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.9fr) minmax(340px, 1.1fr)',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Column: Interactive Price Chart & Live Market Watch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Live Chart for selected symbol */}
            <PriceChart
              symbol={selectedSymbol}
              market={markets[selectedSymbol]}
              priceHistory={currentHistory}
            />

            {/* Markets Watchlist Table with Search & Categories */}
            <LivePriceTable
              markets={markets}
              tickFlashes={tickFlashes}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={s => {
                setSelectedSymbol(s);
                setTicketSide(1);
              }}
            />
          </div>

          {/* Right Column: Sticky Order Execution Ticket */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <OrderTicket
              selectedSymbol={selectedSymbol}
              market={markets[selectedSymbol]}
              portfolio={portfolio}
              onPlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmittingOrder}
              initialSide={ticketSide}
            />
          </div>
        </div>

        {/* Bottom Section: Tabs for Positions, Open Orders, Order History, and Executions */}
        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Tab Selection Navigation */}
          <div className="glass-panel" style={{
            padding: '6px',
            display: 'inline-flex',
            gap: '6px',
            width: 'fit-content',
            borderRadius: 'var(--radius-md)'
          }}>
            <button
              className={`btn ${activeTab === 'positions' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('positions')}
              style={{ padding: '7px 16px', fontSize: '0.8125rem', fontWeight: 600 }}
            >
              {t.positions} ({portfolio.positions.filter(p => p.quantity > 0).length})
            </button>
            <button
              className={`btn ${activeTab === 'openOrders' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('openOrders')}
              style={{ padding: '7px 16px', fontSize: '0.8125rem', fontWeight: 600 }}
            >
              {t.pendingOrders} ({openOrdersCount})
            </button>
            <button
              className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('orders')}
              style={{ padding: '7px 16px', fontSize: '0.8125rem', fontWeight: 600 }}
            >
              {t.orderHistory} ({orders.length})
            </button>
            <button
              className={`btn ${activeTab === 'trades' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('trades')}
              style={{ padding: '7px 16px', fontSize: '0.8125rem', fontWeight: 600 }}
            >
              {t.recentTrades} ({portfolio.recentTrades?.length || 0})
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'positions' && (
            <PositionsTable
              positions={portfolio.positions}
              onSelectSymbol={setSelectedSymbol}
              onTradePosition={handleTradePosition}
            />
          )}

          {activeTab === 'openOrders' && (
            <OrderHistoryTable
              orders={orders.filter(o => o.status === 1)}
              onCancelOrder={handleCancelOrder}
              cancellingOrderId={cancellingOrderId}
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
      </main>
    </div>
  );
};
