namespace StockSquares.Domain.Models;

public record PortfolioMetrics(
    decimal TotalEquity,
    decimal AvailableCash,
    decimal ReservedCash,
    decimal TotalCash,
    decimal RealizedPnL,
    decimal UnrealizedPnL,
    decimal TotalReturnPercentage,
    DateTimeOffset ComputedAt
);
