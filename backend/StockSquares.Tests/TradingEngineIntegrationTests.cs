using FluentAssertions;
using Moq;
using StockSquares.Application.Abstractions;
using StockSquares.Application.Events;
using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Services;
using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;
using StockSquares.Domain.Models;
using StockSquares.Domain.Services;
using Xunit;

namespace StockSquares.Tests;

public class TestTransactionScope : ITransactionScope
{
    public Task CommitAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task RollbackAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public ValueTask DisposeAsync() => ValueTask.CompletedTask;
}

public class InMemoryTradingRepository : ITradingRepository
{
    public Portfolio Portfolio { get; } = new(Guid.NewGuid(), "trader-1", 50000m);
    public List<Order> Orders { get; } = new();
    public List<Trade> Trades { get; } = new();

    public Task<Portfolio> GetOrCreatePortfolioAsync(string userId, CancellationToken cancellationToken = default) => Task.FromResult(Portfolio);
    public Task<Portfolio?> GetPortfolioByIdAsync(Guid portfolioId, CancellationToken cancellationToken = default) => Task.FromResult<Portfolio?>(Portfolio);
    public Task<Order?> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default) => Task.FromResult(Orders.FirstOrDefault(o => o.Id == orderId));
    public Task<List<Order>> GetOrdersAsync(Guid portfolioId, CancellationToken cancellationToken = default) => Task.FromResult(Orders);
    public Task<List<Order>> GetPendingLimitOrdersAsync(string symbol, CancellationToken cancellationToken = default) =>
        Task.FromResult(Orders.Where(o => o.Symbol == symbol && o.Status == OrderStatus.Pending && o.Type == OrderType.Limit).ToList());
    public Task<List<Trade>> GetTradesAsync(Guid portfolioId, CancellationToken cancellationToken = default) => Task.FromResult(Trades);

    public Task AddOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        Orders.Add(order);
        return Task.CompletedTask;
    }

    public Task AddTradeAsync(Trade trade, CancellationToken cancellationToken = default)
    {
        Trades.Add(trade);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task<ITransactionScope> BeginTransactionAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<ITransactionScope>(new TestTransactionScope());
}

public class TradingEngineIntegrationTests
{
    private readonly InMemoryTradingRepository _repository = new();
    private readonly Mock<IPriceFeedService> _priceFeedMock = new();
    private readonly Mock<IRealtimePublisher> _realtimePublisherMock = new();
    private readonly MatchingEngine _matchingEngine = new();
    private readonly TradingEngine _tradingEngine;

    public TradingEngineIntegrationTests()
    {
        _tradingEngine = new TradingEngine(
            _repository,
            _priceFeedMock.Object,
            _realtimePublisherMock.Object,
            _matchingEngine
        );
    }

    [Fact]
    public async Task PlaceOrderAsync_MarketBuy_ExecutesAtomicallyAndPublishesEvents()
    {
        _priceFeedMock.Setup(p => p.GetLatestPrice("BTCUSDT"))
            .Returns(new PriceTick("BTCUSDT", 60000m, 1.5m, 61000m, 59000m, 1000m, DateTimeOffset.UtcNow));

        var command = new PlaceOrderCommand("BTCUSDT", OrderType.Market, OrderSide.Buy, 0.5m, null, null);

        var result = await _tradingEngine.PlaceOrderAsync(command, _repository.Portfolio.Id);

        result.Status.Should().Be(OrderStatus.Filled);
        result.FilledPrice.Should().Be(60000m);

        // 50,000 - (0.5 * 60,000) = 20,000
        _repository.Portfolio.CashBalance.Should().Be(20000m);
        _repository.Orders.Should().HaveCount(1);
        _repository.Trades.Should().HaveCount(1);

        // Realtime events published
        _realtimePublisherMock.Verify(p => p.PublishOrderUpdatedAsync(It.IsAny<OrderUpdatedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
        _realtimePublisherMock.Verify(p => p.PublishPortfolioUpdatedAsync(It.IsAny<PortfolioUpdatedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPriceTickAsync_FillsEligiblePendingLimitOrders()
    {
        // 1. Place a limit buy order at 58,000 when market is at 60,000
        _priceFeedMock.Setup(p => p.GetLatestPrice("BTCUSDT"))
            .Returns(new PriceTick("BTCUSDT", 60000m, 0m, 60000m, 60000m, 100m, DateTimeOffset.UtcNow));

        var command = new PlaceOrderCommand("BTCUSDT", OrderType.Limit, OrderSide.Buy, 0.5m, 58000m, null);
        var orderDto = await _tradingEngine.PlaceOrderAsync(command, _repository.Portfolio.Id);

        orderDto.Status.Should().Be(OrderStatus.Pending);
        _repository.Portfolio.ReservedCash.Should().Be(29000m); // 0.5 * 58,000
        _repository.Portfolio.CashBalance.Should().Be(21000m);

        // 2. Incoming tick: price drops to 57,500!
        var tick = new PriceTick("BTCUSDT", 57500m, -4.0m, 60000m, 57500m, 200m, DateTimeOffset.UtcNow);
        await _tradingEngine.ProcessPriceTickAsync(tick);

        var order = _repository.Orders.First();
        order.Status.Should().Be(OrderStatus.Filled);
        order.FilledPrice.Should().Be(57500m); // Price improvement!

        _repository.Portfolio.ReservedCash.Should().Be(0m);
        // CashBalance gets refunded (29,000 - 28,750) = 250 -> 21,250
        _repository.Portfolio.CashBalance.Should().Be(21250m);
    }

    [Fact]
    public async Task ConcurrentOrders_PreventDoubleSpendingAndNegativeBalance()
    {
        _priceFeedMock.Setup(p => p.GetLatestPrice("BTCUSDT"))
            .Returns(new PriceTick("BTCUSDT", 30000m, 0m, 30000m, 30000m, 100m, DateTimeOffset.UtcNow));

        // Initial balance is $50,000. Each order costs $30,000 (1 BTC).
        // Only 1 order can succeed; the other must throw InsufficientFundsException!
        var cmd1 = new PlaceOrderCommand("BTCUSDT", OrderType.Market, OrderSide.Buy, 1.0m, null, null);
        var cmd2 = new PlaceOrderCommand("BTCUSDT", OrderType.Market, OrderSide.Buy, 1.0m, null, null);

        var task1 = Task.Run(async () =>
        {
            try { return await _tradingEngine.PlaceOrderAsync(cmd1, _repository.Portfolio.Id); }
            catch (DomainException) { return null; }
        });

        var task2 = Task.Run(async () =>
        {
            try { return await _tradingEngine.PlaceOrderAsync(cmd2, _repository.Portfolio.Id); }
            catch (DomainException) { return null; }
        });

        var results = await Task.WhenAll(task1, task2);

        var succeeded = results.Count(r => r != null);
        var failed = results.Count(r => r == null);

        succeeded.Should().Be(1);
        failed.Should().Be(1);
        _repository.Portfolio.CashBalance.Should().Be(20000m); // 50,000 - 30,000 = 20,000
    }
}
