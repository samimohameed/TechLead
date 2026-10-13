using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Orders;

namespace StockSquares.Application.Interfaces;

public interface IOrderService
{
    Task<OrderDto> PlaceOrderAsync(PlaceOrderCommand command, CancellationToken cancellationToken = default);
    Task<OrderDto> CancelOrderAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<PagedResult<OrderDto>> GetOrdersAsync(PaginationRequest request, CancellationToken cancellationToken = default);
    Task<OrderDto> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);
}
