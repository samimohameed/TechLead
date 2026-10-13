namespace StockSquares.Domain.Exceptions;

public class InsufficientPositionException : DomainException
{
    public InsufficientPositionException(string symbol, decimal required, decimal available)
        : base($"Insufficient holdings for {symbol}. Required: {required:F4}, Available: {available:F4}", "INSUFFICIENT_POSITION")
    {
    }
}
