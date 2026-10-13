namespace StockSquares.Application.Abstractions;

public interface IIdempotencyStore
{
    Task<string?> GetResponseAsync(string key, CancellationToken cancellationToken = default);
    Task SaveResponseAsync(string key, string responseJson, TimeSpan ttl, CancellationToken cancellationToken = default);
}
