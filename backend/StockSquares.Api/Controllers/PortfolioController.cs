using Microsoft.AspNetCore.Mvc;
using StockSquares.Application.Common;
using StockSquares.Application.DTOs.Portfolio;
using StockSquares.Application.Interfaces;

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

    [HttpGet]
    public async Task<ActionResult<Result<PortfolioDto>>> GetPortfolio(CancellationToken cancellationToken)
    {
        var portfolio = await _portfolioService.GetPortfolioAsync(cancellationToken);
        return Ok(Result<PortfolioDto>.Success(portfolio));
    }

    [HttpPost("reset")]
    public async Task<ActionResult<Result<PortfolioDto>>> ResetPortfolio(CancellationToken cancellationToken)
    {
        var portfolio = await _portfolioService.ResetPortfolioAsync(cancellationToken);
        return Ok(Result<PortfolioDto>.Success(portfolio, "Portfolio reset successfully"));
    }
}
