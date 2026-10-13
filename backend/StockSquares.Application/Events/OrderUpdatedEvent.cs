namespace StockSquares.Application.Events;

public record OrderUpdatedEvent(
    string OrderId,
    string Status
);
