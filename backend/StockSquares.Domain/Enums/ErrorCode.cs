namespace StockSquares.Domain.Enums;

public enum ErrorCode
{
    None = 1,
    UnknownError = 2,
    NotFound = 3,
    ValidationError = 4,
    Conflict = 5,
    Unauthorized = 6,
    Forbidden = 7,
    DatabaseError = 8,
    InsufficientFunds = 9,
    InsufficientPosition = 10,
    InternalServerError = 11
}
