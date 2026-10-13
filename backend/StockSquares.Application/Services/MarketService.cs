using StockSquares.Application.DTOs.Markets;
using StockSquares.Application.Interfaces;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Application.Services;

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

    public MarketDto GetMarket(string symbol)
    {
        var tick = _priceFeed.GetLatestPrice(symbol);
        if (tick == null)
        {
            throw new DomainException($"Market for symbol '{symbol}' was not found.", "MARKET_NOT_FOUND");
        }

        return MarketDto.FromTick(tick);
    }
}
