using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;

namespace StockSquares.Application.DTOs.Orders;

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
    public static TradeDto FromEntity(Trade trade)
    {
        return new TradeDto(
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
}
