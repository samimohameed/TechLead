namespace StockSquares.Domain.Enums;

public enum OrderType
{
    Market = 1,
    Limit = 2
}

public enum OrderSide
{
    Buy = 1,
    Sell = 2
}

public enum OrderStatus
{
    Pending = 1,
    Filled = 2,
    Cancelled = 3,
    Rejected = 4
}
