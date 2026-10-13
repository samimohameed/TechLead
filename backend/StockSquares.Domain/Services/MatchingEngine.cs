using StockSquares.Domain.Entities;
using StockSquares.Domain.Enums;
using StockSquares.Domain.Exceptions;

namespace StockSquares.Domain.Services;

public class MatchingEngine
{
    /// <summary>
    /// Checks whether an order meets execution criteria against the current market price.
    /// </summary>
    public bool CanFill(Order order, decimal currentMarketPrice)
    {
        if (order.Status != OrderStatus.Pending || currentMarketPrice <= 0)
            return false;

        return order.Type switch
        {
            OrderType.Market => true,
            OrderType.Limit when order.Side == OrderSide.Buy => currentMarketPrice <= (order.LimitPrice ?? 0m),
            OrderType.Limit when order.Side == OrderSide.Sell => currentMarketPrice >= (order.LimitPrice ?? decimal.MaxValue),
            _ => false
        };
    }

    /// <summary>
    /// Computes execution price honoring price improvement for limit orders.
    /// </summary>
    public decimal DetermineExecutionPrice(Order order, decimal currentMarketPrice)
    {
        if (currentMarketPrice <= 0)
            throw new DomainException("Market price must be positive to execute.", "INVALID_PRICE");

        if (order.Type == OrderType.Market)
            return currentMarketPrice;

        if (order.Side == OrderSide.Buy)
        {
            // If market price is lower than limit price, buyer receives price improvement
            return Math.Min(order.LimitPrice ?? currentMarketPrice, currentMarketPrice);
        }

        // If market price is higher than limit price, seller receives price improvement
        return Math.Max(order.LimitPrice ?? currentMarketPrice, currentMarketPrice);
    }

    /// <summary>
    /// Atomically executes an order against the portfolio and returns the resulting Trade.
    /// Invariants and balance reservations are validated and mutated together.
    /// </summary>
    public Trade ExecuteFill(Portfolio portfolio, Order order, decimal currentMarketPrice, DateTimeOffset timestamp)
    {
        if (order.Status != OrderStatus.Pending)
            throw new DomainException($"Cannot execute order in {order.Status} state.", "INVALID_ORDER_STATE");

        if (!CanFill(order, currentMarketPrice))
            throw new DomainException("Order execution condition not met for current market price.", "EXECUTION_CONDITION_NOT_MET");

        decimal executionPrice = DetermineExecutionPrice(order, currentMarketPrice);
        decimal executionCost = Math.Round(order.Quantity * executionPrice, 4);
        var position = portfolio.GetOrCreatePosition(order.Symbol);
        decimal? realizedPnL = null;

        if (order.Side == OrderSide.Buy)
        {
            if (order.Type == OrderType.Market)
            {
                portfolio.DeductCash(executionCost);
            }
            else // Limit Buy
            {
                portfolio.SettleBuyFromReservedCash(executionCost, order.ReservedCash);
            }

            position.AddBuy(order.Quantity, executionPrice, timestamp);
        }
        else // Sell
        {
            if (order.Type == OrderType.Limit)
            {
                position.ReleaseReservedQuantity(order.ReservedQuantity);
            }

            realizedPnL = position.AddSell(order.Quantity, executionPrice, timestamp);
            portfolio.AddCash(executionCost);
        }

        order.MarkFilled(executionPrice, timestamp);

        return new Trade
        {
            OrderId = order.Id,
            PortfolioId = portfolio.Id,
            Symbol = order.Symbol,
            Side = order.Side,
            Quantity = order.Quantity,
            Price = executionPrice,
            TotalValue = executionCost,
            RealizedPnL = realizedPnL,
            ExecutedAt = timestamp
        };
    }

    /// <summary>
    /// Cancels a pending order and releases any reserved cash or assets back to available balances.
    /// </summary>
    public void CancelOrder(Portfolio portfolio, Order order)
    {
        if (order.Status != OrderStatus.Pending)
            throw new DomainException($"Cannot cancel order in {order.Status} state.", "INVALID_ORDER_STATE");

        if (order.Type == OrderType.Limit)
        {
            if (order.Side == OrderSide.Buy && order.ReservedCash > 0)
            {
                portfolio.ReleaseReservedCash(order.ReservedCash);
            }
            else if (order.Side == OrderSide.Sell && order.ReservedQuantity > 0)
            {
                var position = portfolio.GetOrCreatePosition(order.Symbol);
                position.ReleaseReservedQuantity(order.ReservedQuantity);
            }
        }

        order.Cancel();
    }
}
