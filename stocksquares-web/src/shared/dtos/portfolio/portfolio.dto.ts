import { TradeDto } from '../orders/trade.dto';
import { PositionDto } from './position.dto';

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
