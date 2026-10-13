using StockSquares.Domain.Enums;

namespace StockSquares.Application.Orders.Commands;

public record PlaceOrderCommand(
    string Symbol,
    OrderType Type,
    OrderSide Side,
    decimal Quantity,
    decimal? LimitPrice,
    string? IdempotencyKey
);

public record CancelOrderCommand(
    Guid OrderId,
    Guid PortfolioId
);
