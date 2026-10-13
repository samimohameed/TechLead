import { OrderSide } from '../enums';

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
