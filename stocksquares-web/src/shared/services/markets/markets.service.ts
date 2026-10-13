import { Observable } from 'rxjs';
import { HttpService, httpService } from '../http/http.service';
import { MarketDto } from '../../dtos/markets/market.dto';

export class MarketsService {
  constructor(private readonly http: HttpService = httpService) {}

  public getMarkets(): Observable<MarketDto[]> {
    return this.http.get<MarketDto[]>('/api/markets');
  }

  public getMarket(symbol: string): Observable<MarketDto> {
    return this.http.get<MarketDto>(`/api/markets/${encodeURIComponent(symbol)}`);
  }
}

export const marketsService = new MarketsService();
