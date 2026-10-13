using StockSquares.Application.Markets.DTOs;

namespace StockSquares.Application.Markets;

public interface IMarketService
{
    IReadOnlyList<MarketDto> GetMarkets();
    MarketDto? GetMarket(string symbol);
}
