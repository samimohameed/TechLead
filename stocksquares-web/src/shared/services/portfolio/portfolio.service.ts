import { Observable } from 'rxjs';
import { HttpService, httpService } from '../http/http.service';
import { PortfolioDto } from '../../dtos/portfolio/portfolio.dto';

export class PortfolioService {
  constructor(private readonly http: HttpService = httpService) {}

  public getPortfolio(): Observable<PortfolioDto> {
    return this.http.get<PortfolioDto>('/api/portfolio');
  }

  public resetPortfolio(): Observable<PortfolioDto> {
    return this.http.post<PortfolioDto>('/api/portfolio/reset');
  }
}

export const portfolioService = new PortfolioService();
