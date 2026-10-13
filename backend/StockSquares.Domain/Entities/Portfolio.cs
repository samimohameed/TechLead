using StockSquares.Domain.Common;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Domain.Entities;

public class Portfolio : BaseEntity
{
    public string UserId { get; set; } = "trader-1";
    public decimal CashBalance { get; set; } = 50000.00m;
    public decimal ReservedCash { get; set; } = 0.00m;
    public decimal InitialBalance { get; set; } = 50000.00m;

    public List<Position> Positions { get; set; } = new();

    public decimal TotalCash => Math.Round(CashBalance + ReservedCash, 4);
    public decimal TotalPositionValue => Math.Round(Positions.Sum(p => p.MarketValue), 4);
    public decimal TotalEquity => Math.Round(TotalCash + Positions.Sum(p => p.MarketValue), 4);
    public decimal TotalRealizedPnL => Math.Round(Positions.Sum(p => p.RealizedPnL), 4);
    public decimal TotalUnrealizedPnL => Math.Round(Positions.Sum(p => p.UnrealizedPnL), 4);
    public decimal TotalReturnPercentage => InitialBalance > 0 
        ? Math.Round(((TotalEquity - InitialBalance) / InitialBalance) * 100m, 4) 
        : 0m;

    public Portfolio() { }

    public Portfolio(Guid id, string userId, decimal initialBalance = 50000.00m)
    {
        Id = id;
        UserId = userId;
        InitialBalance = initialBalance;
        CashBalance = initialBalance;
        ReservedCash = 0m;
    }

    public Position GetOrCreatePosition(string symbol)
    {
        var normalized = symbol.ToUpperInvariant().Trim();
        var position = Positions.FirstOrDefault(p => p.Symbol == normalized);
        if (position == null)
        {
            position = new Position(Id, normalized);
            Positions.Add(position);
        }
        return position;
    }

    public void ReserveCash(decimal amount)
    {
        if (amount <= 0)
        {
            throw new DomainException("Amount to reserve must be greater than zero.", "INVALID_AMOUNT");
        }

        if (CashBalance < amount)
        {
            throw new InsufficientFundsException(amount, CashBalance);
        }

        CashBalance = Math.Round(CashBalance - amount, 4);
        ReservedCash = Math.Round(ReservedCash + amount, 4);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void ReleaseReservedCash(decimal amount)
    {
        if (amount <= 0)
        {
            return;
        }

        decimal toRelease = Math.Min(ReservedCash, amount);
        ReservedCash = Math.Round(ReservedCash - toRelease, 4);
        CashBalance = Math.Round(CashBalance + toRelease, 4);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void DeductCash(decimal amount)
    {
        if (amount <= 0)
        {
            throw new DomainException("Amount to deduct must be greater than zero.", "INVALID_AMOUNT");
        }

        if (CashBalance < amount)
        {
            throw new InsufficientFundsException(amount, CashBalance);
        }

        CashBalance = Math.Round(CashBalance - amount, 4);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void AddCash(decimal amount)
    {
        if (amount <= 0)
        {
            throw new DomainException("Amount to add must be positive.", "INVALID_AMOUNT");
        }

        CashBalance = Math.Round(CashBalance + amount, 4);
        UpdatedAt = DateTimeOffset.UtcNow;
    }

    public void SettleBuyFromReservedCash(decimal actualCost, decimal previouslyReserved)
    {
        if (actualCost <= 0)
        {
            throw new DomainException("Actual cost must be positive.", "INVALID_AMOUNT");
        }

        if (previouslyReserved > ReservedCash)
        {
            previouslyReserved = ReservedCash;
        }

        ReservedCash = Math.Round(ReservedCash - previouslyReserved, 4);

        decimal difference = previouslyReserved - actualCost;
        if (difference > 0)
        {
            CashBalance = Math.Round(CashBalance + difference, 4);
        }
        else if (difference < 0)
        {
            CashBalance = Math.Round(CashBalance + difference, 4);
        }

        UpdatedAt = DateTimeOffset.UtcNow;
    }
}
