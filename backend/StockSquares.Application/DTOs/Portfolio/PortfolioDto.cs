using StockSquares.Application.DTOs.Orders;
using StockSquares.Domain.Entities;

namespace StockSquares.Application.DTOs.Portfolio;

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
    public static PortfolioDto FromEntity(Domain.Entities.Portfolio entity, List<Trade>? recentTrades = null)
    {
        return new PortfolioDto(
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
            recentTrades?.Select(TradeDto.FromEntity).ToList() ?? new List<TradeDto>()
        );
    }
}
