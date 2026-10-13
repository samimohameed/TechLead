using StockSquares.Application.Abstractions;
using StockSquares.Application.Events;
using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Orders.DTOs;
using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;
using StockSquares.Domain.Models;
using StockSquares.Domain.Services;
using PortfolioEntity = StockSquares.Domain.Entities.Portfolio;

namespace StockSquares.Application.Services;

public class TradingEngine : ITradingEngine
{
    private readonly ITradingRepository _repository;
    private readonly IPriceFeedService _priceFeed;
    private readonly IRealtimePublisher _realtimePublisher;
    private readonly MatchingEngine _matchingEngine;
    private static readonly SemaphoreSlim _executionLock = new(1, 1);

    public TradingEngine(
        ITradingRepository repository,
        IPriceFeedService priceFeed,
        IRealtimePublisher realtimePublisher,
        MatchingEngine matchingEngine)
    {
        _repository = repository;
        _priceFeed = priceFeed;
        _realtimePublisher = realtimePublisher;
        _matchingEngine = matchingEngine;
    }

    public async Task<OrderDto> PlaceOrderAsync(PlaceOrderCommand command, Guid portfolioId, CancellationToken cancellationToken = default)
    {
        Order order;
        PortfolioEntity portfolio;
        OrderUpdatedEvent? orderEvent = null;
        PortfolioUpdatedEvent? portfolioEvent = null;

        await _executionLock.WaitAsync(cancellationToken);
        try
        {
            await using var tx = await _repository.BeginTransactionAsync(cancellationToken);

            portfolio = await _repository.GetPortfolioByIdAsync(portfolioId, cancellationToken)
                ?? throw new DomainException($"Portfolio {portfolioId} not found.", "PORTFOLIO_NOT_FOUND");

            var latestTick = _priceFeed.GetLatestPrice(command.Symbol)
                ?? throw new DomainException($"Market price for {command.Symbol} is currently unavailable.", "PRICE_UNAVAILABLE");

            DateTimeOffset now = DateTimeOffset.UtcNow;

            if (command.Type == OrderType.Market)
            {
                order = Order.CreateMarket(portfolio.Id, command.Symbol, command.Side, command.Quantity, command.IdempotencyKey);

                decimal executionPrice = latestTick.Price;
                decimal estimatedCost = Math.Round(order.Quantity * executionPrice, 4);

                if (order.Side == OrderSide.Buy)
                {
                    if (portfolio.CashBalance < estimatedCost)
                        throw new InsufficientFundsException(estimatedCost, portfolio.CashBalance);
                }
                else
                {
                    var pos = portfolio.GetOrCreatePosition(order.Symbol);
                    if (pos.AvailableQuantity < order.Quantity)
                        throw new InsufficientPositionException(order.Symbol, order.Quantity, pos.AvailableQuantity);
                }

                var trade = _matchingEngine.ExecuteFill(portfolio, order, executionPrice, now);

                await _repository.AddOrderAsync(order, cancellationToken);
                await _repository.AddTradeAsync(trade, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);
            }
            else // Limit Order
            {
                if (!command.LimitPrice.HasValue || command.LimitPrice.Value <= 0)
                    throw new DomainException("Limit price must be greater than zero for Limit orders.", "INVALID_LIMIT_PRICE");

                order = Order.CreateLimit(portfolio.Id, command.Symbol, command.Side, command.Quantity, command.LimitPrice.Value, command.IdempotencyKey);

                if (order.Side == OrderSide.Buy)
                {
                    portfolio.ReserveCash(order.ReservedCash);
                }
                else
                {
                    var pos = portfolio.GetOrCreatePosition(order.Symbol);
                    pos.ReserveQuantity(order.ReservedQuantity);
                }

                await _repository.AddOrderAsync(order, cancellationToken);

                // If limit condition is already satisfied by current market price, fill immediately
                if (_matchingEngine.CanFill(order, latestTick.Price))
                {
                    var trade = _matchingEngine.ExecuteFill(portfolio, order, latestTick.Price, now);
                    await _repository.AddTradeAsync(trade, cancellationToken);
                }

                await _repository.SaveChangesAsync(cancellationToken);
            }

            await tx.CommitAsync(cancellationToken);

            // Prepare events to emit strictly AFTER database transaction commit
            orderEvent = new OrderUpdatedEvent(order.Id.ToString(), order.Status.ToString());
            portfolioEvent = new PortfolioUpdatedEvent(portfolio.CashBalance, portfolio.TotalRealizedPnL, portfolio.TotalUnrealizedPnL);
        }
        finally
        {
            _executionLock.Release();
        }

        // Publish events outside critical database lock
        if (orderEvent != null)
            await _realtimePublisher.PublishOrderUpdatedAsync(orderEvent, cancellationToken);

        if (portfolioEvent != null)
            await _realtimePublisher.PublishPortfolioUpdatedAsync(portfolioEvent, cancellationToken);

        return OrderDto.FromEntity(order);
    }

    public async Task<OrderDto> CancelOrderAsync(Guid orderId, Guid portfolioId, CancellationToken cancellationToken = default)
    {
        Order order;
        PortfolioEntity portfolio;
        OrderUpdatedEvent? orderEvent = null;
        PortfolioUpdatedEvent? portfolioEvent = null;

        await _executionLock.WaitAsync(cancellationToken);
        try
        {
            await using var tx = await _repository.BeginTransactionAsync(cancellationToken);

            order = await _repository.GetOrderByIdAsync(orderId, cancellationToken)
                ?? throw new DomainException($"Order {orderId} not found.", "ORDER_NOT_FOUND");

            if (order.PortfolioId != portfolioId)
                throw new DomainException("Order does not belong to the requested portfolio.", "UNAUTHORIZED_ORDER_ACTION");

            portfolio = await _repository.GetPortfolioByIdAsync(portfolioId, cancellationToken)
                ?? throw new DomainException($"Portfolio {portfolioId} not found.", "PORTFOLIO_NOT_FOUND");

            _matchingEngine.CancelOrder(portfolio, order);

            await _repository.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            orderEvent = new OrderUpdatedEvent(order.Id.ToString(), order.Status.ToString());
            portfolioEvent = new PortfolioUpdatedEvent(portfolio.CashBalance, portfolio.TotalRealizedPnL, portfolio.TotalUnrealizedPnL);
        }
        finally
        {
            _executionLock.Release();
        }

        if (orderEvent != null)
            await _realtimePublisher.PublishOrderUpdatedAsync(orderEvent, cancellationToken);

        if (portfolioEvent != null)
            await _realtimePublisher.PublishPortfolioUpdatedAsync(portfolioEvent, cancellationToken);

        return OrderDto.FromEntity(order);
    }

    public async Task ProcessPriceTickAsync(PriceTick tick, CancellationToken cancellationToken = default)
    {
        var filledEvents = new List<OrderUpdatedEvent>();
        var portfolioEvents = new Dictionary<Guid, PortfolioUpdatedEvent>();

        await _executionLock.WaitAsync(cancellationToken);
        try
        {
            var pendingOrders = await _repository.GetPendingLimitOrdersAsync(tick.Symbol, cancellationToken);
            var eligibleOrders = pendingOrders.Where(o => _matchingEngine.CanFill(o, tick.Price)).ToList();

            if (eligibleOrders.Count > 0)
            {
                await using var tx = await _repository.BeginTransactionAsync(cancellationToken);

                foreach (var order in eligibleOrders)
                {
                    var portfolio = await _repository.GetPortfolioByIdAsync(order.PortfolioId, cancellationToken);
                    if (portfolio == null) continue;

                    var trade = _matchingEngine.ExecuteFill(portfolio, order, tick.Price, tick.Timestamp);
                    await _repository.AddTradeAsync(trade, cancellationToken);

                    filledEvents.Add(new OrderUpdatedEvent(order.Id.ToString(), order.Status.ToString()));
                    portfolioEvents[portfolio.Id] = new PortfolioUpdatedEvent(portfolio.CashBalance, portfolio.TotalRealizedPnL, portfolio.TotalUnrealizedPnL);
                }

                await _repository.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
            }
        }
        finally
        {
            _executionLock.Release();
        }

        // Broadcast order and portfolio updates strictly after commit
        foreach (var ev in filledEvents)
        {
            await _realtimePublisher.PublishOrderUpdatedAsync(ev, cancellationToken);
        }

        foreach (var ev in portfolioEvents.Values)
        {
            await _realtimePublisher.PublishPortfolioUpdatedAsync(ev, cancellationToken);
        }

        // Always broadcast latest price tick to connected clients
        var priceEvent = new PriceUpdatedEvent(
            tick.Symbol,
            tick.Price,
            tick.Timestamp.ToString("o"),
            tick.Source
        );
        await _realtimePublisher.PublishPriceUpdatedAsync(priceEvent, cancellationToken);
    }
}
