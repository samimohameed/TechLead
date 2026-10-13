using FluentAssertions;
using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;
using StockSquares.Domain.Services;
using Xunit;

namespace StockSquares.Tests;

public class MatchingEngineTests
{
    private readonly MatchingEngine _engine = new();
    private readonly Guid _portfolioId = Guid.NewGuid();

    [Fact]
    public void CanFill_MarketOrder_ReturnsTrueWhenPricePositive()
    {
        var order = Order.CreateMarket(_portfolioId, "BTCUSDT", OrderSide.Buy, 1.5m);

        _engine.CanFill(order, 60000m).Should().BeTrue();
    }

    [Theory]
    [InlineData(60000, 60000, true)]   // Exactly at limit
    [InlineData(60000, 59500, true)]   // Price dropped below limit (favorable)
    [InlineData(60000, 60500, false)]  // Price above limit (not reached)
    public void CanFill_LimitBuy_RespectsPriceBoundary(decimal limitPrice, decimal marketPrice, bool expectedCanFill)
    {
        var order = Order.CreateLimit(_portfolioId, "BTCUSDT", OrderSide.Buy, 1.0m, limitPrice);

        _engine.CanFill(order, marketPrice).Should().Be(expectedCanFill);
    }

    [Theory]
    [InlineData(60000, 60000, true)]   // Exactly at limit
    [InlineData(60000, 60500, true)]   // Price rose above limit (favorable)
    [InlineData(60000, 59500, false)]  // Price below limit (not reached)
    public void CanFill_LimitSell_RespectsPriceBoundary(decimal limitPrice, decimal marketPrice, bool expectedCanFill)
    {
        var order = Order.CreateLimit(_portfolioId, "BTCUSDT", OrderSide.Sell, 1.0m, limitPrice);

        _engine.CanFill(order, marketPrice).Should().Be(expectedCanFill);
    }

    [Fact]
    public void DetermineExecutionPrice_HonorsPriceImprovementForLimitBuy()
    {
        var order = Order.CreateLimit(_portfolioId, "BTCUSDT", OrderSide.Buy, 1.0m, 60000m);

        // Limit was 60,000, but market dropped to 59,500. Buyer gets the better price of 59,500.
        decimal execPrice = _engine.DetermineExecutionPrice(order, 59500m);

        execPrice.Should().Be(59500m);
    }

    [Fact]
    public void DetermineExecutionPrice_HonorsPriceImprovementForLimitSell()
    {
        var order = Order.CreateLimit(_portfolioId, "BTCUSDT", OrderSide.Sell, 1.0m, 60000m);

        // Limit was 60,000, but market rallied to 60,500. Seller gets 60,500.
        decimal execPrice = _engine.DetermineExecutionPrice(order, 60500m);

        execPrice.Should().Be(60500m);
    }

    [Fact]
    public void ExecuteFill_MarketBuy_DeductsCashAndIncreasesPosition()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var order = Order.CreateMarket(_portfolioId, "BTCUSDT", OrderSide.Buy, 1.0m);
        var timestamp = DateTimeOffset.UtcNow;

        var trade = _engine.ExecuteFill(portfolio, order, 60000m, timestamp);

        trade.Should().NotBeNull();
        trade.Quantity.Should().Be(1.0m);
        trade.Price.Should().Be(60000m);
        trade.TotalValue.Should().Be(60000m);

        order.Status.Should().Be(OrderStatus.Filled);
        order.FilledPrice.Should().Be(60000m);

        portfolio.CashBalance.Should().Be(40000m); // 100,000 - 60,000

        var pos = portfolio.GetOrCreatePosition("BTCUSDT");
        pos.Quantity.Should().Be(1.0m);
        pos.AverageEntryPrice.Should().Be(60000m);
    }

    [Fact]
    public void ExecuteFill_LimitBuy_SettlesFromReservedCashAndRefundsPriceImprovement()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        // User sets limit buy at 60,000 for 1 BTC -> reserves 60,000
        var order = Order.CreateLimit(_portfolioId, "BTCUSDT", OrderSide.Buy, 1.0m, 60000m);
        portfolio.ReserveCash(order.ReservedCash);

        portfolio.CashBalance.Should().Be(40000m);
        portfolio.ReservedCash.Should().Be(60000m);

        // Filled at improved price 58,000!
        var trade = _engine.ExecuteFill(portfolio, order, 58000m, DateTimeOffset.UtcNow);

        trade.Price.Should().Be(58000m);
        portfolio.ReservedCash.Should().Be(0m);
        // 40,000 + (60,000 reserved - 58,000 actual) = 42,000
        portfolio.CashBalance.Should().Be(42000m);

        var pos = portfolio.GetOrCreatePosition("BTCUSDT");
        pos.Quantity.Should().Be(1.0m);
        pos.AverageEntryPrice.Should().Be(58000m);
    }

    [Fact]
    public void CancelOrder_LimitBuy_ReleasesReservedCashToAvailableBalance()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var order = Order.CreateLimit(_portfolioId, "BTCUSDT", OrderSide.Buy, 1.0m, 60000m);
        portfolio.ReserveCash(order.ReservedCash);

        portfolio.CashBalance.Should().Be(40000m);
        portfolio.ReservedCash.Should().Be(60000m);

        _engine.CancelOrder(portfolio, order);

        order.Status.Should().Be(OrderStatus.Cancelled);
        portfolio.CashBalance.Should().Be(100000m);
        portfolio.ReservedCash.Should().Be(0m);
    }
}
