using Microsoft.AspNetCore.Mvc;
using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Orders;
using StockSquares.Application.Interfaces;

namespace StockSquares.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<ActionResult<Result<OrderDto>>> PlaceOrder([FromBody] PlaceOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await _orderService.PlaceOrderAsync(command, cancellationToken);
        return Ok(Result<OrderDto>.Success(order, "Order placed successfully"));
    }

    [HttpGet]
    public async Task<ActionResult<Result<PagedResult<OrderDto>>>> GetOrders([FromQuery] PaginationRequest request, CancellationToken cancellationToken)
    {
        var pagedOrders = await _orderService.GetOrdersAsync(request, cancellationToken);
        return Ok(Result<PagedResult<OrderDto>>.Success(pagedOrders));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Result<OrderDto>>> GetOrderById(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderService.GetOrderByIdAsync(id, cancellationToken);
        return Ok(Result<OrderDto>.Success(order));
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<Result<OrderDto>>> CancelOrder(Guid id, CancellationToken cancellationToken)
    {
        var cancelledOrder = await _orderService.CancelOrderAsync(id, cancellationToken);
        return Ok(Result<OrderDto>.Success(cancelledOrder, "Order cancelled successfully"));
    }
}
