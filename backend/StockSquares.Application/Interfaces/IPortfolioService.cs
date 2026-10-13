using StockSquares.Application.DTOs.Portfolio;

namespace StockSquares.Application.Interfaces;

public interface IPortfolioService
{
    Task<PortfolioDto> GetPortfolioAsync(CancellationToken cancellationToken = default);
    Task<PortfolioDto> ResetPortfolioAsync(CancellationToken cancellationToken = default);
}
