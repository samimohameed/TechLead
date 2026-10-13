using System.Net;
using System.Text.Json;
using StockSquares.Application.Common;
using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Api.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            var correlationId = context.TraceIdentifier;
            if (!context.Response.Headers.ContainsKey("X-Correlation-ID"))
            {
                context.Response.Headers.Append("X-Correlation-ID", correlationId);
            }

            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        _logger.LogError(ex, "Request failed: {Path} {Method}", context.Request.Path, context.Request.Method);

        var statusCode = HttpStatusCode.InternalServerError;
        var errorCode = ErrorCode.InternalServerError;
        var message = "An unexpected error occurred.";

        if (ex is InsufficientFundsException fundsEx)
        {
            statusCode = HttpStatusCode.BadRequest;
            errorCode = ErrorCode.InsufficientFunds;
            message = fundsEx.Message;
        }
        else if (ex is InsufficientPositionException posEx)
        {
            statusCode = HttpStatusCode.BadRequest;
            errorCode = ErrorCode.InsufficientPosition;
            message = posEx.Message;
        }
        else if (ex is DomainException domainEx)
        {
            if (domainEx.ErrorCode.EndsWith("_NOT_FOUND", StringComparison.OrdinalIgnoreCase))
            {
                statusCode = HttpStatusCode.NotFound;
                errorCode = ErrorCode.NotFound;
            }
            else
            {
                statusCode = HttpStatusCode.BadRequest;
                errorCode = ErrorCode.ValidationError;
            }
            message = domainEx.Message;
        }
        else if (ex is UnauthorizedAccessException authEx)
        {
            statusCode = HttpStatusCode.Unauthorized;
            errorCode = ErrorCode.Unauthorized;
            message = authEx.Message;
        }

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = Result<string>.Failure(message, errorCode);
        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
