using Microsoft.EntityFrameworkCore;
using StockSquares.Application.Interfaces;
using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Infrastructure.Persistence;

public class TradingRepository : ITradingRepository
{
    private readonly TradingDbContext _context;

    public TradingRepository(TradingDbContext context)
    {
        _context = context;
    }

    public async Task<Portfolio> GetOrCreatePortfolioAsync(string userId, CancellationToken cancellationToken = default)
    {
        var portfolio = await _context.Portfolios
            .Include(p => p.Positions)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        if (portfolio == null)
        {
            portfolio = new Portfolio(Guid.NewGuid(), userId, 50000.00m);
            _context.Portfolios.Add(portfolio);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return portfolio;
    }

    public Task<Portfolio?> GetPortfolioByIdAsync(Guid portfolioId, CancellationToken cancellationToken = default)
    {
        return _context.Portfolios
            .Include(p => p.Positions)
            .FirstOrDefaultAsync(p => p.Id == portfolioId, cancellationToken);
    }

    public Task<Order?> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        return _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
    }

    public Task<List<Order>> GetOrdersAsync(Guid portfolioId, CancellationToken cancellationToken = default)
    {
        return _context.Orders
            .Where(o => o.PortfolioId == portfolioId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<Order> Items, int TotalCount)> GetPagedOrdersAsync(Guid portfolioId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Orders
            .Where(o => o.PortfolioId == portfolioId)
            .OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public Task<List<Order>> GetPendingLimitOrdersAsync(string symbol, CancellationToken cancellationToken = default)
    {
        var normalized = symbol.ToUpperInvariant().Trim();
        return _context.Orders
            .Where(o => o.Symbol == normalized && o.Status == OrderStatus.Pending && o.Type == OrderType.Limit)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public Task<List<Trade>> GetTradesAsync(Guid portfolioId, CancellationToken cancellationToken = default)
    {
        return _context.Trades
            .Where(t => t.PortfolioId == portfolioId)
            .OrderByDescending(t => t.ExecutedAt)
            .Take(100)
            .ToListAsync(cancellationToken);
    }

    public async Task AddOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        await _context.Orders.AddAsync(order, cancellationToken);
    }

    public async Task AddTradeAsync(Trade trade, CancellationToken cancellationToken = default)
    {
        await _context.Trades.AddAsync(trade, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<ITransactionScope> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        var tx = await _context.Database.BeginTransactionAsync(cancellationToken);
        return new EfTransactionScope(tx);
    }
}
