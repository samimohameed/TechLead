using StockSquares.Application.Abstractions;
using StockSquares.Application.Markets.DTOs;

namespace StockSquares.Application.Markets;

public class MarketService : IMarketService
{
    private readonly IPriceFeedService _priceFeed;

    public MarketService(IPriceFeedService priceFeed)
    {
        _priceFeed = priceFeed;
    }

    public IReadOnlyList<MarketDto> GetMarkets()
    {
        var prices = _priceFeed.GetAllLatestPrices();
        return prices.Values.Select(MarketDto.FromTick).ToList();
    }

    public MarketDto? GetMarket(string symbol)
    {
        var tick = _priceFeed.GetLatestPrice(symbol);
        return tick != null ? MarketDto.FromTick(tick) : null;
    }
}
