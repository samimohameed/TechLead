using System.Security.Cryptography;
using System.Text;
using StockSquares.Application.DTOs.Orders;

namespace StockSquares.Application.Common;

public static class IdempotencyUtils
{
    public static string ComputeRequestHash(PlaceOrderCommand command)
    {
        var symbol = command.Symbol.ToUpperInvariant().Trim();
        var side = command.Side.ToString();
        var type = command.Type.ToString();
        var quantity = command.Quantity.ToString("G29");
        var limitPrice = command.LimitPrice.HasValue ? command.LimitPrice.Value.ToString("G29") : "none";

        var canonical = $"{symbol}|{side}|{type}|{quantity}|{limitPrice}";
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(canonical));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
