using Microsoft.AspNetCore.Mvc;
using StockSquares.Application.Common;
using StockSquares.Application.Orders;
using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Orders.DTOs;

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

    /// <summary>
    /// Submits a new Market or Limit order with idempotency guarantee.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Result<OrderDto>>> PlaceOrder([FromBody] PlaceOrderCommand command, CancellationToken cancellationToken)
    {
        // Support Idempotency-Key HTTP header as well as payload property
        if (Request.Headers.TryGetValue("Idempotency-Key", out var headerKey) && !string.IsNullOrWhiteSpace(headerKey))
        {
            command = command with { IdempotencyKey = headerKey.ToString().Trim() };
        }

        var order = await _orderService.PlaceOrderAsync(command, cancellationToken);
        return Ok(Result<OrderDto>.Success(order, "Order processed successfully"));
    }

    /// <summary>
    /// Loads complete order history for the current portfolio.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<Result<List<OrderDto>>>> GetOrders(CancellationToken cancellationToken)
    {
        var orders = await _orderService.GetOrdersAsync(cancellationToken);
        return Ok(Result<List<OrderDto>>.Success(orders));
    }

    /// <summary>
    /// Loads a specific order by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Result<OrderDto>>> GetOrderById(Guid id, CancellationToken cancellationToken)
    {
        var order = await _orderService.GetOrderByIdAsync(id, cancellationToken);
        if (order == null)
        {
            return NotFound(Result<OrderDto>.Failure($"Order '{id}' not found.", "ORDER_NOT_FOUND"));
        }

        return Ok(Result<OrderDto>.Success(order));
    }

    /// <summary>
    /// Cancels a pending limit order and releases reserved funds/positions.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<Result<OrderDto>>> CancelOrder(Guid id, CancellationToken cancellationToken)
    {
        var cancelledOrder = await _orderService.CancelOrderAsync(id, cancellationToken);
        return Ok(Result<OrderDto>.Success(cancelledOrder, "Order cancelled successfully"));
    }
}
