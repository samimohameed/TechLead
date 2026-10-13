using StockSquares.Application.DTOs.Markets;

namespace StockSquares.Application.Interfaces;

public interface IMarketService
{
    IReadOnlyList<MarketDto> GetMarkets();
    MarketDto GetMarket(string symbol);
}
