using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockSquares.Domain.Entities;

namespace StockSquares.Infrastructure.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Symbol)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(o => o.Quantity)
            .HasPrecision(18, 8)
            .IsRequired();

        builder.Property(o => o.LimitPrice)
            .HasPrecision(18, 4);

        builder.Property(o => o.ReservedCash)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(o => o.ReservedQuantity)
            .HasPrecision(18, 8)
            .IsRequired();

        builder.Property(o => o.FilledPrice)
            .HasPrecision(18, 4);

        builder.Property(o => o.FilledQuantity)
            .HasPrecision(18, 8)
            .IsRequired();

        builder.Property(o => o.ClientOrderId)
            .HasMaxLength(128);

        builder.Property(o => o.RejectReason)
            .HasMaxLength(500);

        builder.HasIndex(o => o.PortfolioId);
        builder.HasIndex(o => new { o.Symbol, o.Status });
        builder.HasIndex(o => o.ClientOrderId);
    }
}
