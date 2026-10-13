using Microsoft.AspNetCore.Mvc;
using StockSquares.Application.Common;
using StockSquares.Application.Markets;
using StockSquares.Application.Markets.DTOs;

namespace StockSquares.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarketsController : ControllerBase
{
    private readonly IMarketService _marketService;

    public MarketsController(IMarketService marketService)
    {
        _marketService = marketService;
    }

    /// <summary>
    /// Loads current market price snapshots for all tradable assets.
    /// </summary>
    [HttpGet]
    public ActionResult<Result<IReadOnlyList<MarketDto>>> GetMarkets()
    {
        var markets = _marketService.GetMarkets();
        return Ok(Result<IReadOnlyList<MarketDto>>.Success(markets));
    }

    /// <summary>
    /// Loads the latest price snapshot for a specific symbol.
    /// </summary>
    [HttpGet("{symbol}")]
    public ActionResult<Result<MarketDto>> GetMarket(string symbol)
    {
        var market = _marketService.GetMarket(symbol);
        if (market == null)
        {
            return NotFound(Result<MarketDto>.Failure($"Market for symbol '{symbol}' was not found.", ErrorCode.NotFound));
        }

        return Ok(Result<MarketDto>.Success(market));
    }
}
