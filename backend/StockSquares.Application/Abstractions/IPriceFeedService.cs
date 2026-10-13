using StockSquares.Domain.Models;

namespace StockSquares.Application.Abstractions;

public interface IPriceFeedService
{
    PriceTick? GetLatestPrice(string symbol);
    IReadOnlyDictionary<string, PriceTick> GetAllLatestPrices();
    event Func<PriceTick, Task>? OnPriceTickAsync;
    Task StartAsync(CancellationToken cancellationToken = default);
    Task StopAsync(CancellationToken cancellationToken = default);
}
