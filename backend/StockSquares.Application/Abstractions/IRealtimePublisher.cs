using StockSquares.Application.Events;

namespace StockSquares.Application.Abstractions;

public interface IRealtimePublisher
{
    Task PublishPriceUpdatedAsync(PriceUpdatedEvent @event, CancellationToken cancellationToken = default);
    Task PublishOrderUpdatedAsync(OrderUpdatedEvent @event, CancellationToken cancellationToken = default);
    Task PublishPortfolioUpdatedAsync(PortfolioUpdatedEvent @event, CancellationToken cancellationToken = default);
}
