namespace StockSquares.Domain.Common;

/// <summary>
/// Common base entity providing primary key, audit timestamps, and soft delete capabilities.
/// Aligned with the Blocks architecture standard.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; } = false;

    public DateTimeOffset? DeletedAt { get; set; }
}
