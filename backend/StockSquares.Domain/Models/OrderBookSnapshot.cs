namespace StockSquares.Domain.Models;

public record OrderBookSnapshot(
    string Symbol,
    decimal BestBid,
    decimal BestAsk,
    decimal LastPrice,
    decimal Volume24h,
    DateTimeOffset Timestamp
);
