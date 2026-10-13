import { OrderSide, OrderStatus, OrderType } from '../enums';

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
