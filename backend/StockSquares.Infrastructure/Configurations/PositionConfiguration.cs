using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockSquares.Domain.Entities;

namespace StockSquares.Infrastructure.Configurations;

public class PositionConfiguration : IEntityTypeConfiguration<Position>
{
    public void Configure(EntityTypeBuilder<Position> builder)
    {
        builder.ToTable("Positions");

        builder.HasKey(pos => pos.Id);

        builder.Property(pos => pos.Symbol)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(pos => pos.Quantity)
            .HasPrecision(18, 8)
            .IsRequired();

        builder.Property(pos => pos.ReservedQuantity)
            .HasPrecision(18, 8)
            .IsRequired();

        builder.Property(pos => pos.AverageEntryPrice)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(pos => pos.CurrentPrice)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(pos => pos.RealizedPnL)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.HasIndex(pos => new { pos.PortfolioId, pos.Symbol })
            .IsUnique();
    }
}
