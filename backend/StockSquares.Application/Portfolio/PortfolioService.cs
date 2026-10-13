using StockSquares.Application.Abstractions;
using StockSquares.Application.Portfolio.DTOs;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Application.Portfolio;

public class PortfolioService : IPortfolioService
{
    private readonly ITradingRepository _repository;
    private readonly IPriceFeedService _priceFeed;
    private const string DefaultUserId = "trader-1";

    public PortfolioService(
        ITradingRepository repository,
        IPriceFeedService priceFeed)
    {
        _repository = repository;
        _priceFeed = priceFeed;
    }

    public async Task<PortfolioDto> GetPortfolioAsync(CancellationToken cancellationToken = default)
    {
        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);

        // Mark positions to market with current prices from price feed
        DateTimeOffset now = DateTimeOffset.UtcNow;
        foreach (var position in portfolio.Positions)
        {
            var tick = _priceFeed.GetLatestPrice(position.Symbol);
            if (tick != null)
            {
                position.MarkToMarket(tick.Price, now);
            }
        }

        var trades = await _repository.GetTradesAsync(portfolio.Id, cancellationToken);
        return PortfolioDto.FromEntity(portfolio, trades);
    }

    public async Task<PortfolioDto> ResetPortfolioAsync(CancellationToken cancellationToken = default)
    {
        await using var tx = await _repository.BeginTransactionAsync(cancellationToken);
        
        var portfolio = await _repository.GetOrCreatePortfolioAsync(DefaultUserId, cancellationToken);
        
        // Reset balances
        portfolio.CashBalance = portfolio.InitialBalance;
        portfolio.ReservedCash = 0m;
        portfolio.Positions.Clear();
        portfolio.UpdatedAt = DateTimeOffset.UtcNow;

        // Cancel all pending orders
        var pendingOrders = await _repository.GetOrdersAsync(portfolio.Id, cancellationToken);
        foreach (var order in pendingOrders.Where(o => o.Status == Domain.Enums.OrderStatus.Pending))
        {
            order.Cancel();
        }

        await _repository.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return PortfolioDto.FromEntity(portfolio, new());
    }
}
