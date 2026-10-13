export interface PriceUpdatedDto {
  symbol: string;
  price: number;
  timestamp: string;
  source: 'MOCK' | 'BINANCE' | 'FALLBACK';
}

export type PriceUpdated = PriceUpdatedDto;
