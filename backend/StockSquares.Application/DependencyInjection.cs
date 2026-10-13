using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using StockSquares.Application.Abstractions;
using StockSquares.Application.Markets;
using StockSquares.Application.Orders;
using StockSquares.Application.Orders.Commands;
using StockSquares.Application.Portfolio;
using StockSquares.Application.Services;
using StockSquares.Application.Validators;
using StockSquares.Domain.Services;

namespace StockSquares.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // FluentValidation
        services.AddScoped<IValidator<PlaceOrderCommand>, PlaceOrderCommandValidator>();

        // Domain services
        services.AddSingleton<MatchingEngine>();

        // Application core orchestration & use cases
        services.AddScoped<ITradingEngine, TradingEngine>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IPortfolioService, PortfolioService>();
        services.AddScoped<IMarketService, MarketService>();

        return services;
    }
}
