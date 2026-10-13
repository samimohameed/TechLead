using StockSquares.Api.Extensions;
using StockSquares.Api.Filters;
using StockSquares.Api.Middlewares;
using StockSquares.Application;
using StockSquares.Application.Abstractions;
using StockSquares.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// 1. Dependency Injection Layers
builder.Services.AddControllers(options =>
{
    // Automatic FluentValidation action filter matching Blocks-BackEnd
    options.Filters.Add<ValidationActionFilter>();
});

builder.Services.AddCustomCors(builder.Configuration);
builder.Services.AddSwaggerDocumentation();
builder.Services.AddSignalRServices();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();

// 2. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerDocumentation();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCustomCors();
app.UseMiddleware<TransactionMiddleware>();
app.UseAuthorization();

// 3. Endpoint Mappings
app.MapControllers();
app.MapTradingHubs();

app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "Healthy", 
    timestamp = DateTimeOffset.UtcNow,
    engine = "StockSquares Matching Engine .NET 10"
}));

// 4. Initialize Database & Seed
await app.ApplyMigrationsAndSeedAsync();

// 5. Connect Realtime Feed to Trading Engine
var feedService = app.Services.GetRequiredService<IPriceFeedService>();
feedService.OnPriceTickAsync += async tick =>
{
    using var scope = app.Services.CreateScope();
    var tradingEngine = scope.ServiceProvider.GetRequiredService<ITradingEngine>();
    await tradingEngine.ProcessPriceTickAsync(tick);
};

await app.RunAsync();
