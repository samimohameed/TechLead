namespace StockSquares.Application.Events;

public record PortfolioUpdatedEvent(
    decimal AvailableCash,
    decimal RealizedPnl,
    decimal UnrealizedPnl
);
