using System.Text.Json;
using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Orders;
using StockSquares.Application.Interfaces;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Application.Services;

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
        string? idempotencyKey = string.IsNullOrWhiteSpace(command.IdempotencyKey) ? null : command.IdempotencyKey.Trim();
        string? requestHash = idempotencyKey != null ? IdempotencyUtils.ComputeRequestHash(command) : null;

        // 1. Initial check: If key already resolved, return original result. Reject if payload mismatched.
        if (idempotencyKey != null && requestHash != null)
        {
            var cached = await _idempotencyStore.GetResponseAsync(idempotencyKey, requestHash, cancellationToken);
            if (!string.IsNullOrEmpty(cached))
            {
                var cachedOrder = JsonSerializer.Deserialize<OrderDto>(cached);
                if (cachedOrder != null)
                {
                    return cachedOrder;
                }
            }
        }

        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);
        var placedOrder = await _tradingEngine.PlaceOrderAsync(command, portfolio.Id, cancellationToken);

        // 2. Persist key and request hash under database uniqueness constraint
        if (idempotencyKey != null && requestHash != null)
        {
            var json = JsonSerializer.Serialize(placedOrder);
            await _idempotencyStore.SaveResponseAsync(idempotencyKey, requestHash, json, TimeSpan.FromHours(24), cancellationToken);
        }

        return placedOrder;
    }

    public async Task<OrderDto> CancelOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);
        return await _tradingEngine.CancelOrderAsync(orderId, portfolio.Id, cancellationToken);
    }

    public async Task<PagedResult<OrderDto>> GetOrdersAsync(PaginationRequest request, CancellationToken cancellationToken = default)
    {
        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);
        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : request.PageSize;
        var (items, totalCount) = await _repository.GetPagedOrdersAsync(portfolio.Id, page, pageSize, cancellationToken);
        var dtos = items.Select(OrderDto.FromEntity).ToList();
        return new PagedResult<OrderDto>(dtos, totalCount, page, pageSize);
    }

    public async Task<OrderDto> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _repository.GetOrderByIdAsync(orderId, cancellationToken);
        if (order == null)
        {
            throw new DomainException($"Order '{orderId}' was not found.", "ORDER_NOT_FOUND");
        }

        return OrderDto.FromEntity(order);
    }
}
