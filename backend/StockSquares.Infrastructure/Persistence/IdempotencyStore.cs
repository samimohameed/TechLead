using Microsoft.EntityFrameworkCore;
using StockSquares.Application.Interfaces;
using StockSquares.Domain.Exceptions;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Infrastructure.Persistence;

public class IdempotencyStore : IIdempotencyStore
{
    private readonly TradingDbContext _context;

    public IdempotencyStore(TradingDbContext context)
    {
        _context = context;
    }

    public Task<string?> GetResponseAsync(string key, CancellationToken cancellationToken = default)
    {
        return GetResponseAsync(key, string.Empty, cancellationToken);
    }

    public async Task<string?> GetResponseAsync(string key, string requestHash, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var entry = await _context.IdempotencyEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Key == key && e.ExpiresAt > now, cancellationToken);

        if (entry == null)
        {
            return null;
        }

        if (!string.IsNullOrEmpty(requestHash) &&
            !string.IsNullOrEmpty(entry.RequestHash) &&
            !string.Equals(entry.RequestHash, requestHash, StringComparison.OrdinalIgnoreCase))
        {
            throw new DomainException(
                $"Idempotency key '{key}' was previously used with a different request payload.",
                "IDEMPOTENCY_CONFLICT");
        }

        return entry.ResponseJson;
    }

    public Task SaveResponseAsync(string key, string responseJson, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        return SaveResponseAsync(key, string.Empty, responseJson, ttl, cancellationToken);
    }

    public async Task SaveResponseAsync(string key, string requestHash, string responseJson, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var existing = await _context.IdempotencyEntries
            .FirstOrDefaultAsync(e => e.Key == key, cancellationToken);

        if (existing != null)
        {
            if (!string.IsNullOrEmpty(requestHash) &&
                !string.IsNullOrEmpty(existing.RequestHash) &&
                !string.Equals(existing.RequestHash, requestHash, StringComparison.OrdinalIgnoreCase))
            {
                throw new DomainException(
                    $"Idempotency key '{key}' was previously used with a different request payload.",
                    "IDEMPOTENCY_CONFLICT");
            }

            existing.ResponseJson = responseJson;
            existing.ExpiresAt = now.Add(ttl);
        }
        else
        {
            _context.IdempotencyEntries.Add(new IdempotencyEntry
            {
                Key = key,
                RequestHash = requestHash,
                ResponseJson = responseJson,
                CreatedAt = now,
                ExpiresAt = now.Add(ttl)
            });
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            // If another concurrent request inserted the same key under the primary key uniqueness constraint,
            // verify the committed entry's hash matches.
            _context.ChangeTracker.Clear();
            var committed = await _context.IdempotencyEntries
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Key == key, cancellationToken);

            if (committed != null &&
                !string.IsNullOrEmpty(requestHash) &&
                !string.IsNullOrEmpty(committed.RequestHash) &&
                !string.Equals(committed.RequestHash, requestHash, StringComparison.OrdinalIgnoreCase))
            {
                throw new DomainException(
                    $"Idempotency key '{key}' was previously used with a different request payload.",
                    "IDEMPOTENCY_CONFLICT");
            }
        }
    }
}
