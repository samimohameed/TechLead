using StockSquares.Domain.Common;
using StockSquares.Domain.Enums;

namespace StockSquares.Domain.Entities;

public class Trade : BaseEntity
{
    public Guid OrderId { get; set; }
    public Guid PortfolioId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public OrderSide Side { get; set; }
    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal TotalValue { get; set; }
    public decimal? RealizedPnL { get; set; }
    public DateTimeOffset ExecutedAt { get; set; } = DateTimeOffset.UtcNow;
}
