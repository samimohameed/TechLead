using StockSquares.Application.Interfaces;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Infrastructure.Persistence;

public sealed class UnitOfWork : IUnitOfWork
{
    private readonly TradingDbContext _dbContext;

    public UnitOfWork(TradingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _dbContext.SaveChangesAsync(cancellationToken);
    }
}
