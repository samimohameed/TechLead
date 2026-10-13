using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using StockSquares.Application.Interfaces;
using StockSquares.Domain.Common;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Infrastructure.Persistence;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly TradingDbContext _dbContext;

    public Repository(TradingDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IQueryable<T> GetAll()
    {
        return _dbContext.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Set<T>()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public IQueryable<T> GetByFilter(Expression<Func<T, bool>> filter)
    {
        return _dbContext.Set<T>()
            .Where(filter);
    }

    public IQueryable<T> GetByFilterWithTracking(Expression<Func<T, bool>> filter)
    {
        return _dbContext.Set<T>()
            .AsTracking()
            .Where(filter);
    }

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<T>().AddAsync(entity, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<T>().AddRangeAsync(entities, cancellationToken);
    }

    public void Update(T entity)
    {
        _dbContext.Set<T>().Update(entity);
    }

    public void UpdateRange(IEnumerable<T> entities)
    {
        _dbContext.Set<T>().UpdateRange(entities);
    }

    public void SoftDelete(T entity)
    {
        entity.IsDeleted = true;
        entity.DeletedAt = DateTimeOffset.UtcNow;
        Update(entity);
    }

    public void HardDelete(T entity)
    {
        _dbContext.Set<T>().Remove(entity);
    }
}
