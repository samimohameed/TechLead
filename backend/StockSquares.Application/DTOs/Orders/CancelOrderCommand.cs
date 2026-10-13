namespace StockSquares.Application.DTOs.Orders;

public record CancelOrderCommand(
    Guid OrderId,
    Guid PortfolioId
);
