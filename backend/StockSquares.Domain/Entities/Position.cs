using StockSquares.Domain.Common;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Domain.Entities;

public class Position : BaseEntity
{
    public Guid PortfolioId { get; set; }
    public string Symbol { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal AverageEntryPrice { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal RealizedPnL { get; set; }

    public decimal AvailableQuantity => Math.Max(0m, Quantity - ReservedQuantity);
    public decimal UnrealizedPnL => Quantity > 0 ? Math.Round((CurrentPrice - AverageEntryPrice) * Quantity, 4) : 0m;
    public decimal MarketValue => Math.Round(Quantity * CurrentPrice, 4);
    public decimal CostBasis => Math.Round(Quantity * AverageEntryPrice, 4);

    public Position() { }

    public Position(Guid portfolioId, string symbol)
    {
        PortfolioId = portfolioId;
        Symbol = symbol.ToUpperInvariant().Trim();
    }

    public void AddBuy(decimal buyQuantity, decimal buyPrice, DateTimeOffset timestamp)
    {
        if (buyQuantity <= 0)
        {
            throw new DomainException("Buy quantity must be positive.", "INVALID_QUANTITY");
        }

        if (buyPrice <= 0)
        {
            throw new DomainException("Buy price must be positive.", "INVALID_PRICE");
        }

        decimal totalExistingCost = Quantity * AverageEntryPrice;
        decimal incomingCost = buyQuantity * buyPrice;
        decimal totalNewQuantity = Quantity + buyQuantity;

        AverageEntryPrice = Math.Round((totalExistingCost + incomingCost) / totalNewQuantity, 8);
        Quantity = totalNewQuantity;
        CurrentPrice = buyPrice;
        UpdatedAt = timestamp;
    }

    public decimal AddSell(decimal sellQuantity, decimal sellPrice, DateTimeOffset timestamp)
    {
        if (sellQuantity <= 0)
        {
            throw new DomainException("Sell quantity must be positive.", "INVALID_QUANTITY");
        }

        if (sellQuantity > Quantity)
        {
            throw new InsufficientPositionException(Symbol, sellQuantity, Quantity);
        }

        decimal tradeRealizedPnL = Math.Round((sellPrice - AverageEntryPrice) * sellQuantity, 4);
        RealizedPnL += tradeRealizedPnL;

        Quantity -= sellQuantity;
        CurrentPrice = sellPrice;
        UpdatedAt = timestamp;

        if (Quantity == 0)
        {
            AverageEntryPrice = 0m;
            ReservedQuantity = 0m;
        }

        return tradeRealizedPnL;
    }

    public void MarkToMarket(decimal latestPrice, DateTimeOffset timestamp)
    {
        if (latestPrice > 0)
        {
            CurrentPrice = latestPrice;
            UpdatedAt = timestamp;
        }
    }

    public void ReserveQuantity(decimal quantity)
    {
        if (quantity > AvailableQuantity)
        {
            throw new InsufficientPositionException(Symbol, quantity, AvailableQuantity);
        }

        ReservedQuantity += quantity;
    }

    public void ReleaseReservedQuantity(decimal quantity)
    {
        ReservedQuantity = Math.Max(0m, ReservedQuantity - quantity);
    }
}
