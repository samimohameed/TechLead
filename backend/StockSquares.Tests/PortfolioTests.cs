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

        // Buy 1.0 BTC @ $50,000 -> Cost = $50,000, Avg = $50,000
        position.AddBuy(1.0m, 50000m, now);
        position.Quantity.Should().Be(1.0m);
        position.AverageEntryPrice.Should().Be(50000m);

        // Buy 1.0 BTC @ $70,000 -> Total Cost = $120,000, Total Qty = 2.0 -> Avg = $60,000
        position.AddBuy(1.0m, 70000m, now);
        position.Quantity.Should().Be(2.0m);
        position.AverageEntryPrice.Should().Be(60000m);

        // Buy 2.0 BTC @ $80,000 -> Total Cost = $120,000 + $160,000 = $280,000, Total Qty = 4.0 -> Avg = $70,000
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

        // Buy 10 ETH @ $3,000 -> Cost = $30,000
        position.AddBuy(10m, 3000m, now);

        // Sell 4 ETH @ $3,500 -> Profit = (3,500 - 3,000) * 4 = +$2,000
        decimal pnl1 = position.AddSell(4m, 3500m, now);
        pnl1.Should().Be(2000m);
        position.RealizedPnL.Should().Be(2000m);
        position.Quantity.Should().Be(6m);
        position.AverageEntryPrice.Should().Be(3000m); // Entry price unchanged

        // Sell remaining 6 ETH @ $2,800 -> Loss = (2,800 - 3,000) * 6 = -$1,200
        decimal pnl2 = position.AddSell(6m, 2800m, now);
        pnl2.Should().Be(-1200m);
        position.RealizedPnL.Should().Be(800m); // Cumulative: +2,000 - 1,200 = +800
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

        // Price rises to 65,000
        position.MarkToMarket(65000m, now);

        position.CurrentPrice.Should().Be(65000m);
        position.MarketValue.Should().Be(130000m); // 2 * 65,000
        position.CostBasis.Should().Be(120000m);   // 2 * 60,000
        position.UnrealizedPnL.Should().Be(10000m); // (65,000 - 60,000) * 2
    }
}
