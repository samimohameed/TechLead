using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StockSquares.Application.Interfaces;
using StockSquares.Infrastructure.Data;
using StockSquares.Infrastructure.Feeds;
using StockSquares.Infrastructure.Persistence;
using StockSquares.Infrastructure.Realtime;

namespace StockSquares.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<TradingDbContext>(options =>
        {
            var cs = connectionString 
                ?? "Server=(localdb)\\mssqllocaldb;Database=StockSquaresDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";
            options.UseSqlServer(cs);
        });

        services.AddScoped<DbContext>(provider => provider.GetRequiredService<TradingDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ITradingRepository, TradingRepository>();
        services.AddScoped<IIdempotencyStore, IdempotencyStore>();
        services.AddScoped<IRealtimePublisher, SignalRRealtimePublisher>();

        services.AddSingleton<FallbackPriceGenerator>();
        services.AddSingleton<BinanceWebSocketFeedService>();
        services.AddSingleton<IPriceFeedService>(sp => sp.GetRequiredService<BinanceWebSocketFeedService>());
        services.AddHostedService(sp => sp.GetRequiredService<BinanceWebSocketFeedService>());

        return services;
    }
}
