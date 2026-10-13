using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StockSquares.Application.Interfaces;
using StockSquares.Domain.Models;

namespace StockSquares.Infrastructure.Feeds;

public class BinanceWebSocketFeedService : BackgroundService, IPriceFeedService
{
    private readonly FallbackPriceGenerator _fallbackGenerator;
    private readonly ILogger<BinanceWebSocketFeedService> _logger;
    private readonly string[] _symbols = { "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT", "DOGEUSDT" };
    
    private const string BinanceWsUrl = "wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker/bnbusdt@ticker/adausdt@ticker/dogeusdt@ticker";

    public event Func<PriceTick, Task>? OnPriceTickAsync;

    public BinanceWebSocketFeedService(
        FallbackPriceGenerator fallbackGenerator,
        ILogger<BinanceWebSocketFeedService> logger)
    {
        _fallbackGenerator = fallbackGenerator;
        _logger = logger;
    }

    public PriceTick? GetLatestPrice(string symbol)
    {
        return _fallbackGenerator.GetPrice(symbol);
    }

    public IReadOnlyDictionary<string, PriceTick> GetAllLatestPrices()
    {
        return _fallbackGenerator.GetAllPrices();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting Price Feed Ingestion service...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var ws = new ClientWebSocket();
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                cts.CancelAfter(TimeSpan.FromSeconds(10));

                _logger.LogInformation("Attempting connection to Binance WebSocket feed: {Url}", BinanceWsUrl);
                await ws.ConnectAsync(new Uri(BinanceWsUrl), cts.Token);
                _logger.LogInformation("Connected successfully to Binance live stream.");

                await ReceiveWebSocketMessagesAsync(ws, stoppingToken);
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Binance WebSocket disconnected or failed to connect. Falling back to internal Brownian motion feed generator.");
                await RunFallbackLoopAsync(TimeSpan.FromSeconds(30), stoppingToken);
            }
        }
    }

    private async Task ReceiveWebSocketMessagesAsync(ClientWebSocket ws, CancellationToken stoppingToken)
    {
        var buffer = new byte[8192];

        while (ws.State == WebSocketState.Open && !stoppingToken.IsCancellationRequested)
        {
            var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), stoppingToken);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", stoppingToken);
                break;
            }

            var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
            ProcessBinanceMessage(json);
        }
    }

    private void ProcessBinanceMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (!root.TryGetProperty("data", out var data))
            {
                return;
            }

            string symbol = data.GetProperty("s").GetString()?.ToUpperInvariant() ?? string.Empty;
            if (string.IsNullOrEmpty(symbol))
            {
                return;
            }

            if (decimal.TryParse(data.GetProperty("c").GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var price))
            {
                decimal.TryParse(data.GetProperty("P").GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var change24h);
                decimal.TryParse(data.GetProperty("h").GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var high24h);
                decimal.TryParse(data.GetProperty("l").GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var low24h);
                decimal.TryParse(data.GetProperty("v").GetString(), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var volume24h);

                var tick = new PriceTick(
                    symbol,
                    price,
                    change24h,
                    high24h,
                    low24h,
                    volume24h,
                    DateTimeOffset.UtcNow,
                    "BINANCE"
                );

                _fallbackGenerator.UpdatePrice(tick);
                _ = NotifySubscribersAsync(tick);
            }
        }
        catch (Exception ex)
        {
            _logger.LogTrace(ex, "Error parsing Binance message");
        }
    }

    private async Task RunFallbackLoopAsync(TimeSpan duration, CancellationToken stoppingToken)
    {
        var end = DateTimeOffset.UtcNow.Add(duration);
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));

        while (!stoppingToken.IsCancellationRequested && DateTimeOffset.UtcNow < end)
        {
            await timer.WaitForNextTickAsync(stoppingToken);

            foreach (var symbol in _symbols)
            {
                var tick = _fallbackGenerator.GenerateNextTick(symbol, "MOCK");
                await NotifySubscribersAsync(tick);
            }
        }
    }

    private async Task NotifySubscribersAsync(PriceTick tick)
    {
        if (OnPriceTickAsync != null)
        {
            try
            {
                await OnPriceTickAsync.Invoke(tick);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error notifying price tick subscribers for {Symbol}", tick.Symbol);
            }
        }
    }
}
