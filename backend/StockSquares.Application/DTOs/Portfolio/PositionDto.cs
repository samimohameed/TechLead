using StockSquares.Domain.Entities;

namespace StockSquares.Application.DTOs.Portfolio;

public record PositionDto(
    Guid Id,
    Guid PortfolioId,
    string Symbol,
    decimal Quantity,
    decimal ReservedQuantity,
    decimal AvailableQuantity,
    decimal AverageEntryPrice,
    decimal CurrentPrice,
    decimal MarketValue,
    decimal CostBasis,
    decimal UnrealizedPnL,
    decimal RealizedPnL,
    DateTimeOffset UpdatedAt
)
{
    public static PositionDto FromEntity(Position p)
    {
        return new PositionDto(
            p.Id,
            p.PortfolioId,
            p.Symbol,
            p.Quantity,
            p.ReservedQuantity,
            p.AvailableQuantity,
            p.AverageEntryPrice,
            p.CurrentPrice,
            p.MarketValue,
            p.CostBasis,
            p.UnrealizedPnL,
            p.RealizedPnL,
            p.UpdatedAt ?? p.CreatedAt
        );
    }
}
