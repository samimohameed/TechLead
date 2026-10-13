namespace StockSquares.Application.Events;

public record PriceUpdatedEvent(
    string Symbol,
    decimal Price,
    string Timestamp,
    string Source
);
