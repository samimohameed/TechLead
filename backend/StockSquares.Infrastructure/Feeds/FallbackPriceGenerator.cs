using System.Collections.Concurrent;
using StockSquares.Domain.Models;

namespace StockSquares.Infrastructure.Feeds;

public class FallbackPriceGenerator
{
    private readonly ConcurrentDictionary<string, PriceTick> _prices = new();
    private readonly Random _random = new();

    private static readonly Dictionary<string, (decimal BasePrice, decimal Volatility)> InitialConfigs = new()
    {
        { "BTCUSDT", (83500.00m, 0.0015m) },
        { "ETHUSDT", (2650.00m, 0.0020m) },
        { "SOLUSDT", (155.00m, 0.0035m) },
        { "BNBUSDT", (580.00m, 0.0018m) },
        { "ADAUSDT", (0.35m, 0.0040m) },
        { "DOGEUSDT", (0.12m, 0.0050m) }
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
        if (_prices.TryGetValue(symbol.ToUpperInvariant().Trim(), out var tick))
        {
            return tick;
        }
        return null;
    }

    public IReadOnlyDictionary<string, PriceTick> GetAllPrices()
    {
        return _prices;
    }

    public PriceTick GenerateNextTick(string symbol, string source = "FALLBACK")
    {
        var normalized = symbol.ToUpperInvariant().Trim();
        var current = GetPrice(normalized);
        decimal currentPrice;
        if (current != null)
        {
            currentPrice = current.Price;
        }
        else if (InitialConfigs.TryGetValue(normalized, out var cfg))
        {
            currentPrice = cfg.BasePrice;
        }
        else
        {
            currentPrice = 100m;
        }

        decimal vol = 0.002m;
        if (InitialConfigs.TryGetValue(normalized, out var c))
        {
            vol = c.Volatility;
        }

        double deltaPercent = (_random.NextDouble() * 2.0 - 1.0) * (double)vol;
        int decimals = 2;
        if (normalized == "ADAUSDT" || normalized == "DOGEUSDT")
        {
            decimals = 6;
        }
        decimal newPrice = Math.Round(currentPrice * (1m + (decimal)deltaPercent), decimals);

        decimal basePrice = currentPrice;
        if (InitialConfigs.TryGetValue(normalized, out var initCfg))
        {
            basePrice = initCfg.BasePrice;
        }

        decimal change24h = Math.Round(((newPrice - basePrice) / basePrice) * 100m, 2);
        decimal high24h = Math.Max(current?.High24h ?? newPrice, newPrice);
        decimal low24h = Math.Min(current?.Low24h ?? newPrice, newPrice);
        decimal volume24h = (current?.Volume24h ?? 100000m) + Math.Round((decimal)(_random.NextDouble() * 50), 2);

        var tick = new PriceTick(
            normalized,
            newPrice,
            change24h,
            high24h,
            low24h,
            volume24h,
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
