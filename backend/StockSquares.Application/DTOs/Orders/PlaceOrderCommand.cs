using StockSquares.Domain.Enums;

namespace StockSquares.Application.DTOs.Orders;

public record PlaceOrderCommand(
    string Symbol,
    OrderType Type,
    OrderSide Side,
    decimal Quantity,
    decimal? LimitPrice,
    string? IdempotencyKey
);
