using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;

namespace StockSquares.Application.DTOs.Orders;

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
    public static OrderDto FromEntity(Order entity)
    {
        return new OrderDto(
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
}
