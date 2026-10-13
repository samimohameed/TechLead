namespace StockSquares.Application.Events;

public record PriceUpdatedEvent(
    string Symbol,
    decimal Price,
    string Timestamp,
    string Source
);

public record OrderUpdatedEvent(
    string OrderId,
    string Status
);

public record PortfolioUpdatedEvent(
    decimal AvailableCash,
    decimal RealizedPnl,
    decimal UnrealizedPnl
);
