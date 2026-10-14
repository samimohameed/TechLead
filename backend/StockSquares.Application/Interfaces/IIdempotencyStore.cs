namespace StockSquares.Application.Interfaces;

public interface IIdempotencyStore
{
    Task<string?> GetResponseAsync(string key, CancellationToken cancellationToken = default);
    Task<string?> GetResponseAsync(string key, string requestHash, CancellationToken cancellationToken = default);
    Task SaveResponseAsync(string key, string responseJson, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task SaveResponseAsync(string key, string requestHash, string responseJson, TimeSpan ttl, CancellationToken cancellationToken = default);
}
