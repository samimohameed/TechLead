using StockSquares.Application.Portfolio.DTOs;

namespace StockSquares.Application.Portfolio;

public interface IPortfolioService
{
    Task<PortfolioDto> GetPortfolioAsync(CancellationToken cancellationToken = default);
    Task<PortfolioDto> ResetPortfolioAsync(CancellationToken cancellationToken = default);
}
