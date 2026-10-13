namespace StockSquares.Domain.Models;

public record PriceTick(
    string Symbol,
    decimal Price,
    decimal Change24h,
    decimal High24h,
    decimal Low24h,
    decimal Volume24h,
    DateTimeOffset Timestamp,
    string Source = "BINANCE"
);
