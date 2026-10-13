import { OrderSide, OrderType } from '../enums';

export interface PlaceOrderRequest {
  symbol: string;
  type: OrderType;
  side: OrderSide;
  quantity: number;
  limitPrice?: number;
  idempotencyKey?: string;
}
