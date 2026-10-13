using StockSquares.Domain.Entities;

namespace StockSquares.Domain.Models;

public record ExecutionResult(
    bool IsSuccess,
    Trade? Trade,
    decimal ExecutedPrice,
    decimal ExecutedQuantity,
    DateTimeOffset Timestamp,
    string? ErrorReason = null
);
