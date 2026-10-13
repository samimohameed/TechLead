using System.Text.Json;
using FluentAssertions;
using Moq;
using StockSquares.Application.Abstractions;
using StockSquares.Application.Orders;
using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Orders.DTOs;
using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;
using Xunit;

namespace StockSquares.Tests;

public class OrderServiceTests
{
    private readonly Mock<ITradingEngine> _tradingEngineMock = new();
    private readonly Mock<ITradingRepository> _repositoryMock = new();
    private readonly Mock<IIdempotencyStore> _idempotencyStoreMock = new();
    private readonly OrderService _orderService;

    public OrderServiceTests()
    {
        _orderService = new OrderService(
            _tradingEngineMock.Object,
            _repositoryMock.Object,
            _idempotencyStoreMock.Object
        );
    }

    [Fact]
    public async Task PlaceOrderAsync_WhenIdempotencyKeyExists_ReturnsCachedOrderWithoutCallingTradingEngine()
    {
        string idempotencyKey = "client-tx-12345";
        var cachedOrder = new OrderDto(
            Guid.NewGuid(),
            Guid.NewGuid(),
            idempotencyKey,
            "BTCUSDT",
            OrderType.Market,
            OrderSide.Buy,
            1.0m,
            null,
            64000m,
            1.0m,
            OrderStatus.Filled,
            null,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow
        );

        string cachedJson = JsonSerializer.Serialize(cachedOrder);

        _idempotencyStoreMock
            .Setup(s => s.GetResponseAsync(idempotencyKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cachedJson);

        var command = new PlaceOrderCommand(
            "BTCUSDT",
            OrderType.Market,
            OrderSide.Buy,
            1.0m,
            null,
            idempotencyKey
        );

        var result = await _orderService.PlaceOrderAsync(command);

        result.Should().NotBeNull();
        result.Id.Should().Be(cachedOrder.Id);
        result.FilledPrice.Should().Be(64000m);

        // Verify the trading engine was never touched for the duplicate request
        _tradingEngineMock.Verify(e => e.PlaceOrderAsync(It.IsAny<PlaceOrderCommand>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlaceOrderAsync_WhenNewOrder_DelegatesToTradingEngineAndCachesResponse()
    {
        string idempotencyKey = "new-tx-999";
        var portfolioId = Guid.NewGuid();
        var portfolio = new Portfolio(portfolioId, "trader-1", 50000m);

        _repositoryMock
            .Setup(r => r.GetOrCreatePortfolioAsync("trader-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(portfolio);

        _idempotencyStoreMock
            .Setup(s => s.GetResponseAsync(idempotencyKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        var createdDto = new OrderDto(
            Guid.NewGuid(),
            portfolioId,
            idempotencyKey,
            "ETHUSDT",
            OrderType.Limit,
            OrderSide.Buy,
            2.0m,
            3200m,
            null,
            0m,
            OrderStatus.Pending,
            null,
            DateTimeOffset.UtcNow,
            null
        );

        _tradingEngineMock
            .Setup(e => e.PlaceOrderAsync(It.IsAny<PlaceOrderCommand>(), portfolioId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdDto);

        var command = new PlaceOrderCommand("ETHUSDT", OrderType.Limit, OrderSide.Buy, 2.0m, 3200m, idempotencyKey);

        var result = await _orderService.PlaceOrderAsync(command);

        result.Should().NotBeNull();
        result.Id.Should().Be(createdDto.Id);

        _idempotencyStoreMock.Verify(s => s.SaveResponseAsync(
            idempotencyKey,
            It.Is<string>(json => json.Contains(createdDto.Id.ToString())),
            It.IsAny<TimeSpan>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
