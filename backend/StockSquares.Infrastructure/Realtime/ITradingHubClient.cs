using StockSquares.Application.Events;

namespace StockSquares.Infrastructure.Realtime;

public interface ITradingHubClient
{
    Task PriceUpdated(PriceUpdatedEvent @event);
    Task OrderUpdated(OrderUpdatedEvent @event);
    Task PortfolioUpdated(PortfolioUpdatedEvent @event);
}
