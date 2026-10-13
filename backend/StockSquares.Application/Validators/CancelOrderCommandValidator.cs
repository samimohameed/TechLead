using FluentValidation;
using StockSquares.Application.DTOs.Orders;

namespace StockSquares.Application.Validators;

public class CancelOrderCommandValidator : AbstractValidator<CancelOrderCommand>
{
    public CancelOrderCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required.");

        RuleFor(x => x.PortfolioId)
            .NotEmpty().WithMessage("Portfolio ID is required.");
    }
}
