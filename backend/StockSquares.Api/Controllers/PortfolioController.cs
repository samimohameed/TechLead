using Microsoft.AspNetCore.Mvc;
using StockSquares.Application.Common;
using StockSquares.Application.Portfolio;
using StockSquares.Application.Portfolio.DTOs;

namespace StockSquares.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PortfolioController : ControllerBase
{
    private readonly IPortfolioService _portfolioService;

    public PortfolioController(IPortfolioService portfolioService)
    {
        _portfolioService = portfolioService;
    }

    /// <summary>
    /// Loads complete portfolio metrics: available cash, reserved cash, total equity, positions, and P&L.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<Result<PortfolioDto>>> GetPortfolio(CancellationToken cancellationToken)
    {
        var portfolio = await _portfolioService.GetPortfolioAsync(cancellationToken);
        return Ok(Result<PortfolioDto>.Success(portfolio));
    }

    /// <summary>
    /// Resets virtual portfolio back to starting balance for testing.
    /// </summary>
    [HttpPost("reset")]
    public async Task<ActionResult<Result<PortfolioDto>>> ResetPortfolio(CancellationToken cancellationToken)
    {
        var portfolio = await _portfolioService.ResetPortfolioAsync(cancellationToken);
        return Ok(Result<PortfolioDto>.Success(portfolio, "Portfolio reset to initial $50,000.00 cash balance."));
    }
}
