export interface PriceUpdated {
  symbol: string;
  price: number;
  timestamp: string;
  source: "MOCK" | "BINANCE" | "FALLBACK";
}

export interface OrderUpdated {
  orderId: string;
  status: "Pending" | "Filled" | "Cancelled" | "Rejected";
}

export interface PortfolioUpdated {
  availableCash: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

export type ConnectionState = 'Connecting' | 'Connected' | 'Reconnecting' | 'Disconnected';
