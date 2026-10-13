namespace StockSquares.Domain.Exceptions;

public class InsufficientFundsException : DomainException
{
    public InsufficientFundsException(decimal required, decimal available)
        : base($"Insufficient cash balance. Required: ${required:F2}, Available: ${available:F2}", "INSUFFICIENT_FUNDS")
    {
    }
}
