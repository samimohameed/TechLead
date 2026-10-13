using Microsoft.AspNetCore.Mvc;
using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Markets;
using StockSquares.Application.Interfaces;

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

    [HttpGet]
    public ActionResult<Result<IReadOnlyList<MarketDto>>> GetMarkets()
    {
        var markets = _marketService.GetMarkets();
        return Ok(Result<IReadOnlyList<MarketDto>>.Success(markets));
    }

    [HttpGet("{symbol}")]
    public ActionResult<Result<MarketDto>> GetMarket(string symbol)
    {
        var market = _marketService.GetMarket(symbol);
        return Ok(Result<MarketDto>.Success(market));
    }
}
