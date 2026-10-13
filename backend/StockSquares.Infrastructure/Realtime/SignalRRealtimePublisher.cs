using Microsoft.AspNetCore.SignalR;
using StockSquares.Application.Events;
using StockSquares.Application.Interfaces;

namespace StockSquares.Infrastructure.Realtime;

public class SignalRRealtimePublisher : IRealtimePublisher
{
    private readonly IHubContext<TradingHub, ITradingHubClient> _hubContext;

    public SignalRRealtimePublisher(IHubContext<TradingHub, ITradingHubClient> hubContext)
    {
        _hubContext = hubContext;
    }

    public Task PublishPriceUpdatedAsync(PriceUpdatedEvent @event, CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.PriceUpdated(@event);
    }

    public Task PublishOrderUpdatedAsync(OrderUpdatedEvent @event, CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.OrderUpdated(@event);
    }

    public Task PublishPortfolioUpdatedAsync(PortfolioUpdatedEvent @event, CancellationToken cancellationToken = default)
    {
        return _hubContext.Clients.All.PortfolioUpdated(@event);
    }
}
