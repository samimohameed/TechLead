using StockSquares.Application.Orders.DTOs;
using StockSquares.Domain.Entities;

namespace StockSquares.Application.Portfolio.DTOs;

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
    public static PositionDto FromEntity(Position p) => new(
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

public record PortfolioDto(
    Guid Id,
    string UserId,
    decimal AvailableCash,
    decimal ReservedCash,
    decimal TotalCash,
    decimal TotalEquity,
    decimal RealizedPnl,
    decimal UnrealizedPnl,
    decimal TotalReturnPercentage,
    List<PositionDto> Positions,
    List<TradeDto>? RecentTrades = null
)
{
    public static PortfolioDto FromEntity(Domain.Entities.Portfolio entity, List<Trade>? recentTrades = null) => new(
        entity.Id,
        entity.UserId,
        entity.CashBalance,
        entity.ReservedCash,
        entity.TotalCash,
        entity.TotalEquity,
        entity.TotalRealizedPnL,
        entity.TotalUnrealizedPnL,
        entity.TotalReturnPercentage,
        entity.Positions.Select(PositionDto.FromEntity).ToList(),
        recentTrades?.Select(TradeDto.FromEntity).ToList() ?? new()
    );
}
