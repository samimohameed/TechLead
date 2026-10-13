export interface Result<T> {
  isSuccess: boolean;
  message: string;
  errorCode?: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface MarketDto {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: string;
  source: 'MOCK' | 'BINANCE' | 'FALLBACK';
}

export type OrderType = 1 | 2; // 1 = Market, 2 = Limit
export type OrderSide = 1 | 2; // 1 = Buy, 2 = Sell
export type OrderStatus = 1 | 2 | 3 | 4; // 1 = Pending, 2 = Filled, 3 = Cancelled, 4 = Rejected

export interface OrderDto {
  id: string;
  portfolioId: string;
  clientOrderId?: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  limitPrice?: number;
  filledPrice?: number;
  filledQuantity: number;
  status: OrderStatus;
  rejectReason?: string;
  createdAt: string;
  filledAt?: string;
}

export interface PositionDto {
  id: string;
  portfolioId: string;
  symbol: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  realizedPnL: number;
  updatedAt: string;
}

export interface TradeDto {
  id: string;
  orderId: string;
  portfolioId: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  totalValue: number;
  realizedPnL?: number;
  executedAt: string;
}

export interface PortfolioDto {
  id: string;
  userId: string;
  availableCash: number;
  reservedCash: number;
  totalCash: number;
  totalEquity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalReturnPercentage: number;
  positions: PositionDto[];
  recentTrades: TradeDto[];
}

export interface PlaceOrderRequest {
  symbol: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  limitPrice?: number;
  idempotencyKey?: string;
}
