using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Orders.DTOs;

namespace StockSquares.Application.Orders;

public interface IOrderService
{
    Task<OrderDto> PlaceOrderAsync(PlaceOrderCommand command, CancellationToken cancellationToken = default);
    Task<OrderDto> CancelOrderAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<List<OrderDto>> GetOrdersAsync(CancellationToken cancellationToken = default);
    Task<OrderDto?> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);
}
