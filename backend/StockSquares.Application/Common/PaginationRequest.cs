namespace StockSquares.Application.Common;

/// <summary>
/// Standard pagination request matching Blocks architecture.
/// </summary>
public class PaginationRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
