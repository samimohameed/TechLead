using StockSquares.Api.Extensions;
using StockSquares.Api.Filters;
using StockSquares.Api.Middlewares;
using StockSquares.Application;
using StockSquares.Application.Interfaces;
using StockSquares.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationActionFilter>();
});

builder.Services.AddCustomCors(builder.Configuration);
builder.Services.AddSwaggerDocumentation();
builder.Services.AddSignalRServices();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwaggerDocumentation();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCustomCors();
app.UseMiddleware<TransactionMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapTradingHubs();

app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "Healthy", 
    timestamp = DateTimeOffset.UtcNow,
    engine = "StockSquares Matching Engine .NET 10"
}));

await app.ApplyMigrationsAndSeedAsync();

var feedService = app.Services.GetRequiredService<IPriceFeedService>();
feedService.OnPriceTickAsync += async tick =>
{
    using var scope = app.Services.CreateScope();
    var tradingEngine = scope.ServiceProvider.GetRequiredService<ITradingEngine>();
    await tradingEngine.ProcessPriceTickAsync(tick);
};

await app.RunAsync();
