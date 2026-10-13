using FluentAssertions;
using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Orders;
using StockSquares.Application.Validators;
using StockSquares.Domain.Enums;
using Xunit;

namespace StockSquares.Tests;

public class ValidatorTests
{
    private readonly PlaceOrderCommandValidator _placeOrderValidator = new();
    private readonly CancelOrderCommandValidator _cancelOrderValidator = new();
    private readonly PaginationRequestValidator _paginationValidator = new();

    [Fact]
    public void PlaceOrderCommandValidator_ValidCommand_Passes()
    {
        var cmd = new PlaceOrderCommand("BTCUSDT", OrderType.Limit, OrderSide.Buy, 1.0m, 50000m, "key-1");
        var result = _placeOrderValidator.Validate(cmd);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void PlaceOrderCommandValidator_MissingLimitPriceOnLimitOrder_Fails()
    {
        var cmd = new PlaceOrderCommand("BTCUSDT", OrderType.Limit, OrderSide.Buy, 1.0m, null, "key-1");
        var result = _placeOrderValidator.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(PlaceOrderCommand.LimitPrice));
    }

    [Fact]
    public void CancelOrderCommandValidator_EmptyGuid_Fails()
    {
        var cmd = new CancelOrderCommand(Guid.Empty, Guid.NewGuid());
        var result = _cancelOrderValidator.Validate(cmd);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(CancelOrderCommand.OrderId));
    }

    [Fact]
    public void PaginationRequestValidator_InvalidPageAndSize_Fails()
    {
        var req = new PaginationRequest { Page = 0, PageSize = 150 };
        var result = _paginationValidator.Validate(req);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCount(2);
    }
}
