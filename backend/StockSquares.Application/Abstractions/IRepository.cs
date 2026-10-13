using System.Linq.Expressions;
using StockSquares.Domain.Common;

namespace StockSquares.Application.Abstractions;

/// <summary>
/// Generic repository interface directly matching the Blocks architecture standard.
/// </summary>
public interface IRepository<T> where T : BaseEntity
{
    IQueryable<T> GetAll();
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    IQueryable<T> GetByFilter(Expression<Func<T, bool>> filter);
    IQueryable<T> GetByFilterWithTracking(Expression<Func<T, bool>> filter);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
    void Update(T entity);
    void UpdateRange(IEnumerable<T> entities);
    void SoftDelete(T entity);
    void HardDelete(T entity);
}

/// <summary>
/// Unit of work interface for transactional persistence coordination.
/// </summary>
public interface IUnitOfWork
{
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
