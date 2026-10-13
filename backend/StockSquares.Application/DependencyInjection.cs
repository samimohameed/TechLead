using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Orders;
using StockSquares.Application.Interfaces;
using StockSquares.Application.Services;
using StockSquares.Application.Validators;

namespace StockSquares.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IValidator<PlaceOrderCommand>, PlaceOrderCommandValidator>();
        services.AddScoped<IValidator<CancelOrderCommand>, CancelOrderCommandValidator>();
        services.AddScoped<IValidator<PaginationRequest>, PaginationRequestValidator>();
        services.AddSingleton<IMatchingEngine, MatchingEngine>();
        services.AddScoped<ITradingEngine, TradingEngine>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IPortfolioService, PortfolioService>();
        services.AddScoped<IMarketService, MarketService>();

        return services;
    }
}
