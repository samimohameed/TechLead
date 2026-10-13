using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Orders.DTOs;
using StockSquares.Domain.Models;

namespace StockSquares.Application.Abstractions;

public interface ITradingEngine
{
    Task<OrderDto> PlaceOrderAsync(PlaceOrderCommand command, Guid portfolioId, CancellationToken cancellationToken = default);
    Task<OrderDto> CancelOrderAsync(Guid orderId, Guid portfolioId, CancellationToken cancellationToken = default);
    Task ProcessPriceTickAsync(PriceTick tick, CancellationToken cancellationToken = default);
}
