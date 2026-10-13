export interface OrderUpdatedDto {
  orderId: string;
  status: 'Pending' | 'Filled' | 'Cancelled' | 'Rejected';
}

export type OrderUpdated = OrderUpdatedDto;
