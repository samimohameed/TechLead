using System.Text.Json;
using StockSquares.Application.Abstractions;
using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Orders.DTOs;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Application.Orders;

public class OrderService : IOrderService
{
    private readonly ITradingEngine _tradingEngine;
    private readonly ITradingRepository _repository;
    private readonly IIdempotencyStore _idempotencyStore;
    private const string DefaultUserId = "trader-1";

    public OrderService(
        ITradingEngine tradingEngine,
        ITradingRepository repository,
        IIdempotencyStore idempotencyStore)
    {
        _tradingEngine = tradingEngine;
        _repository = repository;
        _idempotencyStore = idempotencyStore;
    }

    public async Task<OrderDto> PlaceOrderAsync(PlaceOrderCommand command, CancellationToken cancellationToken = default)
    {
        // 1. Check idempotency store if a key is provided
        if (!string.IsNullOrWhiteSpace(command.IdempotencyKey))
        {
            var cached = await _idempotencyStore.GetResponseAsync(command.IdempotencyKey.Trim(), cancellationToken);
            if (!string.IsNullOrEmpty(cached))
            {
                var cachedOrder = JsonSerializer.Deserialize<OrderDto>(cached);
                if (cachedOrder != null)
                {
                    return cachedOrder;
                }
            }
        }

        // 2. Resolve default portfolio
        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);

        // 3. Coordinate order placement through serialized trading engine
        var placedOrder = await _tradingEngine.PlaceOrderAsync(command, portfolio.Id, cancellationToken);

        // 4. Cache response in idempotency store
        if (!string.IsNullOrWhiteSpace(command.IdempotencyKey))
        {
            var json = JsonSerializer.Serialize(placedOrder);
            await _idempotencyStore.SaveResponseAsync(command.IdempotencyKey.Trim(), json, TimeSpan.FromHours(24), cancellationToken);
        }

        return placedOrder;
    }

    public async Task<OrderDto> CancelOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);
        return await _tradingEngine.CancelOrderAsync(orderId, portfolio.Id, cancellationToken);
    }

    public async Task<List<OrderDto>> GetOrdersAsync(CancellationToken cancellationToken = default)
    {
        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);
        var orders = await _repository.GetOrdersAsync(portfolio.Id, cancellationToken);
        return orders.Select(OrderDto.FromEntity).ToList();
    }

    public async Task<OrderDto?> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _repository.GetOrderByIdAsync(orderId, cancellationToken);
        return order != null ? OrderDto.FromEntity(order) : null;
    }
}
