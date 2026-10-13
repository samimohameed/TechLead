using FluentAssertions;
using StockSquares.Domain.Entities;
using StockSquares.Domain.Exceptions;
using Xunit;

namespace StockSquares.Tests;

public class PortfolioTests
{
    private readonly Guid _portfolioId = Guid.NewGuid();

    [Fact]
    public void Portfolio_InitialState_HasCorrectDefaults()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 50000m);

        portfolio.CashBalance.Should().Be(50000m);
        portfolio.ReservedCash.Should().Be(0m);
        portfolio.TotalCash.Should().Be(50000m);
        portfolio.TotalEquity.Should().Be(50000m);
        portfolio.TotalRealizedPnL.Should().Be(0m);
        portfolio.TotalUnrealizedPnL.Should().Be(0m);
        portfolio.Positions.Should().BeEmpty();
    }

    [Fact]
    public void ReserveCash_WithSufficientBalance_LocksCashCorrectly()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 50000m);

        portfolio.ReserveCash(15000m);

        portfolio.CashBalance.Should().Be(35000m);
        portfolio.ReservedCash.Should().Be(15000m);
        portfolio.TotalCash.Should().Be(50000m);
    }

    [Fact]
    public void ReserveCash_WithInsufficientBalance_ThrowsInsufficientFundsException()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 1000m);

        var action = () => portfolio.ReserveCash(5000m);

        action.Should().Throw<InsufficientFundsException>()
            .WithMessage("*Insufficient cash balance*");
    }

    [Fact]
    public void Position_WeightedAverageCostBasis_ComputesAccuratelyAcrossMultipleBuys()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var position = portfolio.GetOrCreatePosition("BTCUSDT");
        var now = DateTimeOffset.UtcNow;

        position.AddBuy(1.0m, 50000m, now);
        position.Quantity.Should().Be(1.0m);
        position.AverageEntryPrice.Should().Be(50000m);

        position.AddBuy(1.0m, 70000m, now);
        position.Quantity.Should().Be(2.0m);
        position.AverageEntryPrice.Should().Be(60000m);

        position.AddBuy(2.0m, 80000m, now);
        position.Quantity.Should().Be(4.0m);
        position.AverageEntryPrice.Should().Be(70000m);
    }

    [Fact]
    public void Position_RealizedPnL_CalculatesAccuratelyOnPartialAndFullSales()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var position = portfolio.GetOrCreatePosition("ETHUSDT");
        var now = DateTimeOffset.UtcNow;

        position.AddBuy(10m, 3000m, now);

        decimal pnl1 = position.AddSell(4m, 3500m, now);
        pnl1.Should().Be(2000m);
        position.RealizedPnL.Should().Be(2000m);
        position.Quantity.Should().Be(6m);
        position.AverageEntryPrice.Should().Be(3000m);

        decimal pnl2 = position.AddSell(6m, 2800m, now);
        pnl2.Should().Be(-1200m);
        position.RealizedPnL.Should().Be(800m);
        position.Quantity.Should().Be(0m);
        position.AverageEntryPrice.Should().Be(0m);
    }

    [Fact]
    public void Position_AddSell_ExceedingAvailableQuantity_ThrowsInsufficientPositionException()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var position = portfolio.GetOrCreatePosition("SOLUSDT");
        var now = DateTimeOffset.UtcNow;

        position.AddBuy(5m, 150m, now);

        var action = () => position.AddSell(10m, 160m, now);

        action.Should().Throw<InsufficientPositionException>()
            .WithMessage("*Insufficient holdings for SOLUSDT*");
    }

    [Fact]
    public void Position_MarkToMarket_ComputesUnrealizedPnLAndMarketValue()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var position = portfolio.GetOrCreatePosition("BTCUSDT");
        var now = DateTimeOffset.UtcNow;

        position.AddBuy(2.0m, 60000m, now);

        position.MarkToMarket(65000m, now);

        position.CurrentPrice.Should().Be(65000m);
        position.MarketValue.Should().Be(130000m);
        position.CostBasis.Should().Be(120000m);
        position.UnrealizedPnL.Should().Be(10000m);
    }
}
