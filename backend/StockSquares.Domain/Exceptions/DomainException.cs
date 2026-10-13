namespace StockSquares.Domain.Exceptions;

public class DomainException : Exception
{
    public string ErrorCode { get; }

    public DomainException(string message, string errorCode = "DOMAIN_ERROR") 
        : base(message)
    {
        ErrorCode = errorCode;
    }
}

public class InsufficientFundsException : DomainException
{
    public InsufficientFundsException(decimal required, decimal available)
        : base($"Insufficient cash balance. Required: ${required:F2}, Available: ${available:F2}", "INSUFFICIENT_FUNDS")
    {
    }
}

public class InsufficientPositionException : DomainException
{
    public InsufficientPositionException(string symbol, decimal required, decimal available)
        : base($"Insufficient holdings for {symbol}. Required: {required:F4}, Available: {available:F4}", "INSUFFICIENT_POSITION")
    {
    }
}
