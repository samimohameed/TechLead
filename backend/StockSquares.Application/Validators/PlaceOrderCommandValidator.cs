using FluentValidation;
using StockSquares.Application.DTOs.Orders;
using StockSquares.Domain.Enums;

namespace StockSquares.Application.Validators;

public class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(x => x.Symbol)
            .NotEmpty().WithMessage("Symbol is required.")
            .MaximumLength(20).WithMessage("Symbol cannot exceed 20 characters.");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid order type.");

        RuleFor(x => x.Side)
            .IsInEnum().WithMessage("Invalid order side.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than zero.");

        RuleFor(x => x.LimitPrice)
            .NotNull().When(x => x.Type == OrderType.Limit).WithMessage("Limit price is required for Limit orders.")
            .GreaterThan(0).When(x => x.Type == OrderType.Limit).WithMessage("Limit price must be greater than zero for Limit orders.");
    }
}
