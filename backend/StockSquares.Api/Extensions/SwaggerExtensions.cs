using Microsoft.OpenApi.Models;

namespace StockSquares.Api.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "StockSquares Trading API",
                Version = "v1",
                Description = "High-performance paper trading platform matching engine API (.NET 10)"
            });
        });

        return services;
    }

    public static IApplicationBuilder UseSwaggerDocumentation(this IApplicationBuilder app)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "StockSquares API v1");
            c.RoutePrefix = "swagger";
        });

        return app;
    }
}
