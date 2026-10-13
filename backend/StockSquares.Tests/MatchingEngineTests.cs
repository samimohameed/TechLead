using FluentAssertions;
using StockSquares.Application.Services;
using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;
using Xunit;

namespace StockSquares.Tests;

public class MatchingEngineTests
{
    private readonly MatchingEngine _engine = new();
    private readonly Guid _portfolioId = Guid.NewGuid();

    [Fact]
    public void CanFill_MarketOrder_ReturnsTrueWhenPricePositive()
    {
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Buy,
            Quantity = 1.5m,
            Type = OrderType.Market,
            Status = OrderStatus.Pending
        };

        _engine.CanFill(order, 60000m).Should().BeTrue();
    }

    [Theory]
    [InlineData(60000, 60000, true)]
    [InlineData(60000, 59500, true)]
    [InlineData(60000, 60500, false)]
    public void CanFill_LimitBuy_RespectsPriceBoundary(decimal limitPrice, decimal marketPrice, bool expectedCanFill)
    {
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Buy,
            Quantity = 1.0m,
            LimitPrice = limitPrice,
            Type = OrderType.Limit,
            ReservedCash = Math.Round(1.0m * limitPrice, 4),
            Status = OrderStatus.Pending
        };

        _engine.CanFill(order, marketPrice).Should().Be(expectedCanFill);
    }

    [Theory]
    [InlineData(60000, 60000, true)]
    [InlineData(60000, 60500, true)]
    [InlineData(60000, 59500, false)]
    public void CanFill_LimitSell_RespectsPriceBoundary(decimal limitPrice, decimal marketPrice, bool expectedCanFill)
    {
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Sell,
            Quantity = 1.0m,
            LimitPrice = limitPrice,
            Type = OrderType.Limit,
            ReservedQuantity = 1.0m,
            Status = OrderStatus.Pending
        };

        _engine.CanFill(order, marketPrice).Should().Be(expectedCanFill);
    }

    [Fact]
    public void DetermineExecutionPrice_HonorsPriceImprovementForLimitBuy()
    {
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Buy,
            Quantity = 1.0m,
            LimitPrice = 60000m,
            Type = OrderType.Limit,
            Status = OrderStatus.Pending
        };

        decimal execPrice = _engine.DetermineExecutionPrice(order, 59500m);

        execPrice.Should().Be(59500m);
    }

    [Fact]
    public void DetermineExecutionPrice_HonorsPriceImprovementForLimitSell()
    {
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Sell,
            Quantity = 1.0m,
            LimitPrice = 60000m,
            Type = OrderType.Limit,
            Status = OrderStatus.Pending
        };

        decimal execPrice = _engine.DetermineExecutionPrice(order, 60500m);

        execPrice.Should().Be(60500m);
    }

    [Fact]
    public void ExecuteFill_MarketBuy_DeductsCashAndIncreasesPosition()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Buy,
            Quantity = 1.0m,
            Type = OrderType.Market,
            Status = OrderStatus.Pending
        };
        var timestamp = DateTimeOffset.UtcNow;

        var trade = _engine.ExecuteFill(portfolio, order, 60000m, timestamp);

        trade.Should().NotBeNull();
        trade.Quantity.Should().Be(1.0m);
        trade.Price.Should().Be(60000m);
        trade.TotalValue.Should().Be(60000m);

        order.Status.Should().Be(OrderStatus.Filled);
        order.FilledPrice.Should().Be(60000m);

        portfolio.CashBalance.Should().Be(40000m);

        var pos = portfolio.GetOrCreatePosition("BTCUSDT");
        pos.Quantity.Should().Be(1.0m);
        pos.AverageEntryPrice.Should().Be(60000m);
    }

    [Fact]
    public void ExecuteFill_LimitBuy_SettlesFromReservedCashAndRefundsPriceImprovement()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Buy,
            Quantity = 1.0m,
            LimitPrice = 60000m,
            Type = OrderType.Limit,
            ReservedCash = 60000m,
            Status = OrderStatus.Pending
        };
        portfolio.ReserveCash(order.ReservedCash);

        portfolio.CashBalance.Should().Be(40000m);
        portfolio.ReservedCash.Should().Be(60000m);

        var trade = _engine.ExecuteFill(portfolio, order, 58000m, DateTimeOffset.UtcNow);

        trade.Price.Should().Be(58000m);
        portfolio.ReservedCash.Should().Be(0m);
        portfolio.CashBalance.Should().Be(42000m);

        var pos = portfolio.GetOrCreatePosition("BTCUSDT");
        pos.Quantity.Should().Be(1.0m);
        pos.AverageEntryPrice.Should().Be(58000m);
    }

    [Fact]
    public void CancelOrder_LimitBuy_ReleasesReservedCashToAvailableBalance()
    {
        var portfolio = new Portfolio(_portfolioId, "user-1", 100000m);
        var order = new Order
        {
            PortfolioId = _portfolioId,
            Symbol = "BTCUSDT",
            Side = OrderSide.Buy,
            Quantity = 1.0m,
            LimitPrice = 60000m,
            Type = OrderType.Limit,
            ReservedCash = 60000m,
            Status = OrderStatus.Pending
        };
        portfolio.ReserveCash(order.ReservedCash);

        portfolio.CashBalance.Should().Be(40000m);
        portfolio.ReservedCash.Should().Be(60000m);

        _engine.CancelOrder(portfolio, order);

        order.Status.Should().Be(OrderStatus.Cancelled);
        portfolio.CashBalance.Should().Be(100000m);
        portfolio.ReservedCash.Should().Be(0m);
    }
}
