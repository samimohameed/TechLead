using StockSquares.Domain.Entities;
using PortfolioEntity = StockSquares.Domain.Entities.Portfolio;

namespace StockSquares.Application.Interfaces;

public interface IMatchingEngine
{
    bool CanFill(Order order, decimal currentMarketPrice);
    decimal DetermineExecutionPrice(Order order, decimal currentMarketPrice);
    Trade ExecuteFill(PortfolioEntity portfolio, Order order, decimal currentMarketPrice, DateTimeOffset timestamp);
    void CancelOrder(PortfolioEntity portfolio, Order order);
}
