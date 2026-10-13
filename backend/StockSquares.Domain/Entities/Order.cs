using StockSquares.Domain.Common;
using StockSquares.Domain.Enums;

namespace StockSquares.Domain.Entities;

public class Order : BaseEntity
{
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
    public DateTimeOffset? FilledAt { get; set; }
}
