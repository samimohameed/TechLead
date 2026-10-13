using StockSquares.Domain.Entities;

namespace StockSquares.Domain.Models;

public record LimitOrderTrigger(
    Order Order,
    decimal MarketPrice,
    bool IsTriggered,
    DateTimeOffset EvaluatedAt
);
