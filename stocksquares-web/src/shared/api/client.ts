import { Result, MarketDto, PortfolioDto, OrderDto, PlaceOrderRequest } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers || {});
    
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    const json = (await response.json()) as Result<T>;

    if (!response.ok || !json.isSuccess) {
      const err = new Error(json.message || `Request failed with status ${response.status}`);
      (err as any).errorCode = json.errorCode;
      (err as any).errors = json.errors;
      throw err;
    }

    return json.data;
  }

  public async getMarkets(): Promise<MarketDto[]> {
    return this.request<MarketDto[]>('/api/markets');
  }

  public async getPortfolio(): Promise<PortfolioDto> {
    return this.request<PortfolioDto>('/api/portfolio');
  }

  public async getOrders(): Promise<OrderDto[]> {
    return this.request<OrderDto[]>('/api/orders');
  }

  public async placeOrder(request: PlaceOrderRequest): Promise<OrderDto> {
    const idempotencyKey = request.idempotencyKey || `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return this.request<OrderDto>('/api/orders', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ ...request, idempotencyKey })
    });
  }

  public async cancelOrder(orderId: string): Promise<OrderDto> {
    return this.request<OrderDto>(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  public async resetPortfolio(): Promise<PortfolioDto> {
    return this.request<PortfolioDto>('/api/portfolio/reset', {
      method: 'POST'
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export const SIGNALR_URL = `${API_BASE_URL}/hubs/trading`;
