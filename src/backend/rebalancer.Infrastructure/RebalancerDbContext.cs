using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class RebalancerDbContext : DbContext
{
    public RebalancerDbContext(DbContextOptions<RebalancerDbContext> options) : base(options)
    {
    }

    public DbSet<Person> People { get; set; } = null!;
    public DbSet<Institution> Institutions { get; set; } = null!;
    public DbSet<Account> Accounts { get; set; } = null!;
    public DbSet<Position> Positions { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Person>(entity =>
        {
            entity.ToTable("people");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<Institution>(entity =>
        {
            entity.ToTable("institutions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.InstitutionId).HasColumnName("institution_id");
            entity.Property(e => e.OwnerId).HasColumnName("owner_id");
            entity.Property(e => e.AccountType).HasColumnName("account_type").HasConversion<string>();
            entity.Property(e => e.IsRetirement).HasColumnName("is_retirement");

            entity.HasOne(e => e.Institution)
                .WithMany()
                .HasForeignKey(e => e.InstitutionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Owner)
                .WithMany()
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Position>(entity =>
        {
            entity.ToTable("positions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AccountId).HasColumnName("account_id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.PositionType).HasColumnName("position_type").HasConversion<string>();
            entity.Property(e => e.AssetClass).HasColumnName("asset_class").HasConversion<string>();
            entity.Property(e => e.Value).HasColumnName("value").HasPrecision(18, 2);

            entity.HasOne(e => e.Account)
                .WithMany(a => a.Positions)
                .HasForeignKey(e => e.AccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
