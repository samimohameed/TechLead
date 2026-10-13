using Microsoft.EntityFrameworkCore;
using StockSquares.Application.Abstractions;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Infrastructure.Persistence;

public class IdempotencyStore : IIdempotencyStore
{
    private readonly TradingDbContext _context;

    public IdempotencyStore(TradingDbContext context)
    {
        _context = context;
    }

    public async Task<string?> GetResponseAsync(string key, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var entry = await _context.IdempotencyEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Key == key && e.ExpiresAt > now, cancellationToken);

        return entry?.ResponseJson;
    }

    public async Task SaveResponseAsync(string key, string responseJson, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        var existing = await _context.IdempotencyEntries
            .FirstOrDefaultAsync(e => e.Key == key, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        if (existing != null)
        {
            existing.ResponseJson = responseJson;
            existing.ExpiresAt = now.Add(ttl);
        }
        else
        {
            _context.IdempotencyEntries.Add(new IdempotencyEntry
            {
                Key = key,
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
            // Already inserted concurrently by another request
        }
    }
}
