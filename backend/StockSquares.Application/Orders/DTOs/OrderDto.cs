using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;

namespace StockSquares.Application.Orders.DTOs;

public record OrderDto(
    Guid Id,
    Guid PortfolioId,
    string? ClientOrderId,
    string Symbol,
    OrderType Type,
    OrderSide Side,
    decimal Quantity,
    decimal? LimitPrice,
    decimal? FilledPrice,
    decimal FilledQuantity,
    OrderStatus Status,
    string? RejectReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset? FilledAt
)
{
    public static OrderDto FromEntity(Order entity) => new(
        entity.Id,
        entity.PortfolioId,
        entity.ClientOrderId,
        entity.Symbol,
        entity.Type,
        entity.Side,
        entity.Quantity,
        entity.LimitPrice,
        entity.FilledPrice,
        entity.FilledQuantity,
        entity.Status,
        entity.RejectReason,
        entity.CreatedAt,
        entity.FilledAt
    );
}

public record TradeDto(
    Guid Id,
    Guid OrderId,
    Guid PortfolioId,
    string Symbol,
    OrderSide Side,
    decimal Quantity,
    decimal Price,
    decimal TotalValue,
    decimal? RealizedPnL,
    DateTimeOffset ExecutedAt
)
{
    public static TradeDto FromEntity(Trade trade) => new(
        trade.Id,
        trade.OrderId,
        trade.PortfolioId,
        trade.Symbol,
        trade.Side,
        trade.Quantity,
        trade.Price,
        trade.TotalValue,
        trade.RealizedPnL,
        trade.ExecutedAt
    );
}
