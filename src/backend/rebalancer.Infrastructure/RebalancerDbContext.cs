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
    public DbSet<Security> Securities { get; set; } = null!;
    public DbSet<Holding> Holdings { get; set; } = null!;
    public DbSet<AssetCategory> AssetCategories { get; set; } = null!;
    public DbSet<Model> Models { get; set; } = null!;
    public DbSet<ModelAllocation> ModelAllocations { get; set; } = null!;
    public DbSet<SecurityComposition> SecurityCompositions { get; set; } = null!;

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

        modelBuilder.Entity<Security>(entity =>
        {
            entity.ToTable("securities");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Ticker).HasColumnName("ticker").IsRequired().HasMaxLength(20);
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.PositionType).HasColumnName("position_type").HasConversion<string>();
            entity.Property(e => e.AssetClass).HasColumnName("asset_class").HasConversion<string>();
            entity.Property(e => e.AssetCategoryId).HasColumnName("asset_category_id");
            entity.Property(e => e.Price).HasColumnName("price").HasPrecision(18, 4);

            entity.HasIndex(e => e.Ticker).IsUnique();

            entity.HasOne(e => e.AssetCategory)
                .WithMany()
                .HasForeignKey(e => e.AssetCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Compositions)
                .WithOne()
                .HasForeignKey(e => e.SecurityId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SecurityComposition>(entity =>
        {
            entity.ToTable("security_compositions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.SecurityId).HasColumnName("security_id");
            entity.Property(e => e.ComponentSecurityId).HasColumnName("component_security_id");
            entity.Property(e => e.Percentage).HasColumnName("percentage").HasPrecision(5, 2);

            entity.HasOne(e => e.ComponentSecurity)
                .WithMany()
                .HasForeignKey(e => e.ComponentSecurityId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Holding>(entity =>
        {
            entity.ToTable("holdings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AccountId).HasColumnName("account_id");
            entity.Property(e => e.SecurityId).HasColumnName("security_id");
            entity.Property(e => e.Shares).HasColumnName("shares").HasPrecision(18, 6);

            entity.Ignore(e => e.Value);

            entity.HasOne(e => e.Account)
                .WithMany(a => a.Holdings)
                .HasForeignKey(e => e.AccountId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Security)
                .WithMany(s => s.Holdings)
                .HasForeignKey(e => e.SecurityId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AssetCategory>(entity =>
        {
            entity.ToTable("asset_categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            entity.Property(e => e.DisplayOrder).HasColumnName("display_order");

            entity.HasOne(e => e.Parent)
                .WithMany(e => e.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Model>(entity =>
        {
            entity.ToTable("models");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasColumnName("description").HasMaxLength(500);
        });

        modelBuilder.Entity<ModelAllocation>(entity =>
        {
            entity.ToTable("model_allocations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ModelId).HasColumnName("model_id");
            entity.Property(e => e.AssetCategoryId).HasColumnName("asset_category_id");
            entity.Property(e => e.TargetPercentage).HasColumnName("target_percentage").HasPrecision(5, 2);

            entity.HasOne(e => e.Model)
                .WithMany(m => m.Allocations)
                .HasForeignKey(e => e.ModelId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.AssetCategory)
                .WithMany()
                .HasForeignKey(e => e.AssetCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
