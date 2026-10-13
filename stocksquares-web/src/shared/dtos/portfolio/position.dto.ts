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
