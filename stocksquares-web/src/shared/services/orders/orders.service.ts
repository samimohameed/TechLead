import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService, httpService } from '../http/http.service';
import { OrderDto } from '../../dtos/orders/order.dto';
import { PlaceOrderRequest } from '../../dtos/orders/place-order-request.dto';
import { PagedResult } from '../../dtos/common/paged-result.dto';

export class OrdersService {
  constructor(private readonly http: HttpService = httpService) {}

  public getPagedOrders(page: number = 1, pageSize: number = 10): Observable<PagedResult<OrderDto>> {
    return this.http.get<PagedResult<OrderDto>>(`/api/orders?page=${page}&pageSize=${pageSize}`);
  }

  public getOrders(page: number = 1, pageSize: number = 50): Observable<PagedResult<OrderDto>> {
    return this.getPagedOrders(page, pageSize);
  }

  public getOrdersList(page: number = 1, pageSize: number = 50): Observable<OrderDto[]> {
    return this.getPagedOrders(page, pageSize).pipe(
      map(res => res.items ?? [])
    );
  }

  public placeOrder(request: PlaceOrderRequest): Observable<OrderDto> {
    const idempotencyKey =
      request.idempotencyKey ||
      `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    return this.http.post<OrderDto>(
      '/api/orders',
      { ...request, idempotencyKey },
      {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      }
    );
  }

  public cancelOrder(orderId: string): Observable<OrderDto> {
    return this.http.delete<OrderDto>(`/api/orders/${orderId}`);
  }
}

export const ordersService = new OrdersService();
