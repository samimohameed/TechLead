using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockSquares.Domain.Entities;

namespace StockSquares.Infrastructure.Configurations;

public class PortfolioConfiguration : IEntityTypeConfiguration<Portfolio>
{
    public void Configure(EntityTypeBuilder<Portfolio> builder)
    {
        builder.ToTable("Portfolios");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.UserId)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(p => p.CashBalance)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(p => p.ReservedCash)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(p => p.InitialBalance)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.HasMany(p => p.Positions)
            .WithOne()
            .HasForeignKey(pos => pos.PortfolioId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.UserId)
            .IsUnique();
    }
}
