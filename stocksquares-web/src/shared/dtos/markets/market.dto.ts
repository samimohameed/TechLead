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
