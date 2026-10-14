using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Orders;
using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;
using StockSquares.Infrastructure.Data;
using StockSquares.Infrastructure.Persistence;
using Xunit;

namespace StockSquares.Tests;

public class IdempotencyTests
{
    private TradingDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<TradingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new TradingDbContext(options);
    }

    [Fact]
    public async Task SaveResponseAsync_PersistsKeyAndHash_UnderUniqueConstraint()
    {
        using var context = CreateInMemoryDbContext();
        var store = new IdempotencyStore(context);

        string key = "tx-unique-1";
        string hash = "hash-12345";
        string responseJson = "{\"id\":\"order-1\",\"status\":\"Filled\"}";

        await store.SaveResponseAsync(key, hash, responseJson, TimeSpan.FromHours(1));

        var result = await store.GetResponseAsync(key, hash);

        result.Should().Be(responseJson);
    }

    [Fact]
    public async Task GetResponseAsync_WhenPayloadMismatches_ThrowsConflictException()
    {
        using var context = CreateInMemoryDbContext();
        var store = new IdempotencyStore(context);

        string key = "tx-reuse-key";
        string originalHash = "hash-original-order";
        string differentHash = "hash-different-order";

        await store.SaveResponseAsync(key, originalHash, "{\"id\":\"1\"}", TimeSpan.FromHours(1));

        var act = async () => await store.GetResponseAsync(key, differentHash);

        var exception = await act.Should().ThrowAsync<DomainException>();
        exception.Which.ErrorCode.Should().Be("IDEMPOTENCY_CONFLICT");
    }

    [Fact]
    public async Task SaveResponseAsync_WhenKeyReusedWithDifferentHash_ThrowsConflictException()
    {
        using var context = CreateInMemoryDbContext();
        var store = new IdempotencyStore(context);

        string key = "tx-reuse-save";
        string hash1 = "hash-1";
        string hash2 = "hash-2";

        await store.SaveResponseAsync(key, hash1, "{\"id\":\"1\"}", TimeSpan.FromHours(1));

        var act = async () => await store.SaveResponseAsync(key, hash2, "{\"id\":\"2\"}", TimeSpan.FromHours(1));

        var exception = await act.Should().ThrowAsync<DomainException>();
        exception.Which.ErrorCode.Should().Be("IDEMPOTENCY_CONFLICT");
    }

    [Fact]
    public void IdempotencyUtils_ComputeRequestHash_ProducesDeterministicHash()
    {
        var cmd1 = new PlaceOrderCommand("BTCUSDT", OrderType.Limit, OrderSide.Buy, 1.50000000m, 65000.0000m, "key-1");
        var cmd2 = new PlaceOrderCommand("btcusdt ", OrderType.Limit, OrderSide.Buy, 1.5m, 65000m, "key-1");
        var cmdDifferent = new PlaceOrderCommand("ETHUSDT", OrderType.Limit, OrderSide.Buy, 1.5m, 65000m, "key-1");

        var hash1 = IdempotencyUtils.ComputeRequestHash(cmd1);
        var hash2 = IdempotencyUtils.ComputeRequestHash(cmd2);
        var hashDifferent = IdempotencyUtils.ComputeRequestHash(cmdDifferent);

        hash1.Should().Be(hash2, "normalized order parameters must produce identical hash");
        hash1.Should().NotBe(hashDifferent, "different symbols must produce different hashes");
    }
}
