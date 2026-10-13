using StockSquares.Domain.Entities;
using PortfolioEntity = StockSquares.Domain.Entities.Portfolio;

namespace StockSquares.Application.Abstractions;

public interface ITradingRepository
{
    Task<PortfolioEntity> GetOrCreatePortfolioAsync(string userId, CancellationToken cancellationToken = default);
    Task<PortfolioEntity?> GetPortfolioByIdAsync(Guid portfolioId, CancellationToken cancellationToken = default);
    Task<Order?> GetOrderByIdAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<List<Order>> GetOrdersAsync(Guid portfolioId, CancellationToken cancellationToken = default);
    Task<List<Order>> GetPendingLimitOrdersAsync(string symbol, CancellationToken cancellationToken = default);
    Task<List<Trade>> GetTradesAsync(Guid portfolioId, CancellationToken cancellationToken = default);
    
    Task AddOrderAsync(Order order, CancellationToken cancellationToken = default);
    Task AddTradeAsync(Trade trade, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
    
    Task<ITransactionScope> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
