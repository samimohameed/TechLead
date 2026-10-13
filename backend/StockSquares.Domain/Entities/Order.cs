using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Domain.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PortfolioId { get; set; }
    public string? ClientOrderId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public OrderType Type { get; set; }
    public OrderSide Side { get; set; }
    public decimal Quantity { get; set; }
    public decimal? LimitPrice { get; set; }
    public decimal ReservedCash { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal? FilledPrice { get; set; }
    public decimal FilledQuantity { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public string? RejectReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FilledAt { get; set; }

    public Order() { }

    public static Order CreateMarket(Guid portfolioId, string symbol, OrderSide side, decimal quantity, string? clientOrderId = null)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.", "INVALID_QUANTITY");

        if (string.IsNullOrWhiteSpace(symbol))
            throw new DomainException("Symbol is required.", "INVALID_SYMBOL");

        return new Order
        {
            PortfolioId = portfolioId,
            ClientOrderId = clientOrderId,
            Symbol = symbol.ToUpperInvariant().Trim(),
            Type = OrderType.Market,
            Side = side,
            Quantity = quantity,
            Status = OrderStatus.Pending
        };
    }

    public static Order CreateLimit(Guid portfolioId, string symbol, OrderSide side, decimal quantity, decimal limitPrice, string? clientOrderId = null)
    {
        if (quantity <= 0)
            throw new DomainException("Quantity must be greater than zero.", "INVALID_QUANTITY");

        if (limitPrice <= 0)
            throw new DomainException("Limit price must be greater than zero.", "INVALID_PRICE");

        if (string.IsNullOrWhiteSpace(symbol))
            throw new DomainException("Symbol is required.", "INVALID_SYMBOL");

        return new Order
        {
            PortfolioId = portfolioId,
            ClientOrderId = clientOrderId,
            Symbol = symbol.ToUpperInvariant().Trim(),
            Type = OrderType.Limit,
            Side = side,
            Quantity = quantity,
            LimitPrice = limitPrice,
            ReservedCash = side == OrderSide.Buy ? Math.Round(quantity * limitPrice, 4) : 0m,
            ReservedQuantity = side == OrderSide.Sell ? quantity : 0m,
            Status = OrderStatus.Pending
        };
    }

    public void MarkFilled(decimal executionPrice, DateTimeOffset filledAt)
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException($"Cannot fill order in {Status} state.", "INVALID_ORDER_STATE");

        if (executionPrice <= 0)
            throw new DomainException("Execution price must be greater than zero.", "INVALID_PRICE");

        FilledPrice = executionPrice;
        FilledQuantity = Quantity;
        Status = OrderStatus.Filled;
        FilledAt = filledAt;
    }

    public void Cancel()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException($"Cannot cancel order in {Status} state.", "INVALID_ORDER_STATE");

        Status = OrderStatus.Cancelled;
    }

    public void Reject(string reason)
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException($"Cannot reject order in {Status} state.", "INVALID_ORDER_STATE");

        Status = OrderStatus.Rejected;
        RejectReason = reason;
    }
}
