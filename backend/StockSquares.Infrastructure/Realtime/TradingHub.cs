using Microsoft.AspNetCore.SignalR;

namespace StockSquares.Infrastructure.Realtime;

public class TradingHub : Hub<ITradingHubClient>
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }
}
