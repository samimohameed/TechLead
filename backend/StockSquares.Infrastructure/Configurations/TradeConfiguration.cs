using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockSquares.Domain.Entities;

namespace StockSquares.Infrastructure.Configurations;

public class TradeConfiguration : IEntityTypeConfiguration<Trade>
{
    public void Configure(EntityTypeBuilder<Trade> builder)
    {
        builder.ToTable("Trades");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Symbol)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(t => t.Quantity)
            .HasPrecision(18, 8)
            .IsRequired();

        builder.Property(t => t.Price)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(t => t.TotalValue)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(t => t.RealizedPnL)
            .HasPrecision(18, 4);

        builder.HasIndex(t => t.PortfolioId);
        builder.HasIndex(t => t.OrderId);
    }
}
