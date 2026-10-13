using Microsoft.EntityFrameworkCore;
using StockSquares.Domain.Entities;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Api.Extensions;

public static class DatabaseExtensions
{
    public static async Task ApplyMigrationsAndSeedAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TradingDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<TradingDbContext>>();

        try
        {
            await context.Database.EnsureCreatedAsync();

            // Seed default trader portfolio if not present
            var existing = await context.Portfolios.FirstOrDefaultAsync(p => p.UserId == "trader-1");
            if (existing == null)
            {
                var portfolio = new Portfolio(Guid.NewGuid(), "trader-1", 50000.00m);
                context.Portfolios.Add(portfolio);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded default trader-1 portfolio with $50,000.00 balance.");
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Database initialization warning (e.g. if SQL Server is not reachable yet).");
        }
    }
}
