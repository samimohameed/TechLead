using System.Collections.Concurrent;
using StockSquares.Domain.Models;

namespace StockSquares.Infrastructure.Feeds;

public class FallbackPriceGenerator
{
    private readonly ConcurrentDictionary<string, PriceTick> _prices = new();
    private readonly Random _random = new();

    private static readonly Dictionary<string, (decimal BasePrice, decimal Volatility)> InitialConfigs = new()
    {
        { "BTCUSDT", (64500.00m, 0.0015m) },
        { "ETHUSDT", (3450.00m, 0.0020m) },
        { "SOLUSDT", (155.00m, 0.0035m) },
        { "BNBUSDT", (580.00m, 0.0018m) },
        { "ADAUSDT", (0.42m, 0.0040m) },
        { "DOGEUSDT", (0.125m, 0.0050m) }
    };

    public FallbackPriceGenerator()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var (symbol, (basePrice, _)) in InitialConfigs)
        {
            _prices[symbol] = new PriceTick(
                symbol,
                basePrice,
                0.85m,
                Math.Round(basePrice * 1.02m, 4),
                Math.Round(basePrice * 0.98m, 4),
                1250000m,
                now,
                "MOCK"
            );
        }
    }

    public PriceTick? GetPrice(string symbol)
    {
        return _prices.TryGetValue(symbol.ToUpperInvariant().Trim(), out var tick) ? tick : null;
    }

    public IReadOnlyDictionary<string, PriceTick> GetAllPrices()
    {
        return _prices;
    }

    public PriceTick GenerateNextTick(string symbol, string source = "FALLBACK")
    {
        var normalized = symbol.ToUpperInvariant().Trim();
        var current = GetPrice(normalized);
        decimal currentPrice = current?.Price ?? (InitialConfigs.TryGetValue(normalized, out var cfg) ? cfg.BasePrice : 100m);
        decimal vol = InitialConfigs.TryGetValue(normalized, out var c) ? c.Volatility : 0.002m;

        // Geometric Brownian motion step: random delta [-vol, +vol]
        double deltaPercent = (_random.NextDouble() * 2.0 - 1.0) * (double)vol;
        decimal newPrice = Math.Round(currentPrice * (1m + (decimal)deltaPercent), normalized == "ADAUSDT" || normalized == "DOGEUSDT" ? 6 : 2);

        decimal basePrice = InitialConfigs.TryGetValue(normalized, out var initCfg) ? initCfg.BasePrice : currentPrice;
        decimal change24h = Math.Round(((newPrice - basePrice) / basePrice) * 100m, 2);
        decimal high24h = Math.Max(current?.High24h ?? newPrice, newPrice);
        decimal low24h = Math.Min(current?.Low24h ?? newPrice, newPrice);

        var tick = new PriceTick(
            normalized,
            newPrice,
            change24h,
            high24h,
            low24h,
            (current?.Volume24h ?? 100000m) + Math.Round((decimal)(_random.NextDouble() * 50), 2),
            DateTimeOffset.UtcNow,
            source
        );

        _prices[normalized] = tick;
        return tick;
    }

    public void UpdatePrice(PriceTick tick)
    {
        _prices[tick.Symbol] = tick;
    }
}
