using StockSquares.Domain.Models;

namespace StockSquares.Application.DTOs.Markets;

public record MarketDto(
    string Symbol,
    decimal Price,
    decimal Change24h,
    decimal High24h,
    decimal Low24h,
    decimal Volume24h,
    DateTimeOffset Timestamp,
    string Source
)
{
    public static MarketDto FromTick(PriceTick tick)
    {
        return new MarketDto(
            tick.Symbol,
            tick.Price,
            tick.Change24h,
            tick.High24h,
            tick.Low24h,
            tick.Volume24h,
            tick.Timestamp,
            tick.Source
        );
    }
}
