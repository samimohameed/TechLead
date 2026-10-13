using Microsoft.AspNetCore.SignalR;
using StockSquares.Application.Abstractions;
using StockSquares.Application.Events;

namespace StockSquares.Infrastructure.Realtime;

public interface ITradingHubClient
{
    Task PriceUpdated(PriceUpdatedEvent @event);
    Task OrderUpdated(OrderUpdatedEvent @event);
    Task PortfolioUpdated(PortfolioUpdatedEvent @event);
}

public class TradingHub : Hub<ITradingHubClient>
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }
}

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
