using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using StockSquares.Infrastructure.Data;

namespace StockSquares.Infrastructure.Configurations;

public class IdempotencyEntryConfiguration : IEntityTypeConfiguration<IdempotencyEntry>
{
    public void Configure(EntityTypeBuilder<IdempotencyEntry> builder)
    {
        builder.ToTable("IdempotencyEntries");

        // Primary key creates a clustered unique index ensuring database-level uniqueness
        builder.HasKey(i => i.Key);

        builder.Property(i => i.Key)
            .HasMaxLength(128);

        builder.Property(i => i.RequestHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(i => i.ResponseJson)
            .IsRequired();

        builder.HasIndex(i => i.ExpiresAt);
    }
}
