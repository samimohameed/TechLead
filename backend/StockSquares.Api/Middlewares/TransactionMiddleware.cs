using System.Diagnostics;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Api.Middlewares;

public class TransactionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TransactionMiddleware> _logger;

    public TransactionMiddleware(RequestDelegate next, ILogger<TransactionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, TradingDbContext dbContext)
    {
        var method = context.Request.Method;

        if (!IsWriteRequest(method) || dbContext.Database.CurrentTransaction != null)
        {
            await _next(context);
            return;
        }

        var path = context.Request.Path;
        _logger.LogInformation("Transaction Started | Request: {Method} {Path}", method, path);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            await _next(context);

            if (dbContext.ChangeTracker.HasChanges())
            {
                await dbContext.SaveChangesAsync(context.RequestAborted);
            }

            stopwatch.Stop();
            _logger.LogInformation("Request Completed | {Method} {Path} | Elapsed: {ElapsedMs}ms", method, path, stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Request Failed | {Method} {Path} | Reason: {Reason} | Elapsed: {ElapsedMs}ms", method, path, ex.Message, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    private static bool IsWriteRequest(string method)
    {
        return HttpMethods.IsPost(method) ||
               HttpMethods.IsPut(method) ||
               HttpMethods.IsPatch(method) ||
               HttpMethods.IsDelete(method);
    }
}
