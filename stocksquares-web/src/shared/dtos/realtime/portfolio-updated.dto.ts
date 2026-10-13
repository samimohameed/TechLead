export interface PortfolioUpdatedDto {
  availableCash: number;
  realizedPnl: number;
  unrealizedPnl: number;
}

export type PortfolioUpdated = PortfolioUpdatedDto;
