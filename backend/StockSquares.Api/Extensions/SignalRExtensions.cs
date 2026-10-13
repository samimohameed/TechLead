using StockSquares.Infrastructure.Realtime;

namespace StockSquares.Api.Extensions;

public static class SignalRExtensions
{
    public static IServiceCollection AddSignalRServices(this IServiceCollection services)
    {
        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = true;
            options.KeepAliveInterval = TimeSpan.FromSeconds(10);
            options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
        });

        return services;
    }

    public static IEndpointRouteBuilder MapTradingHubs(this IEndpointRouteBuilder app)
    {
        app.MapHub<TradingHub>("/hubs/trading");
        return app;
    }
}
