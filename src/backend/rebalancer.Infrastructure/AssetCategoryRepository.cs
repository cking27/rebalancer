using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class AssetCategoryRepository : IAssetCategoryRepository
{
    private readonly RebalancerDbContext _context;

    public AssetCategoryRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<AssetCategory>> GetAsync()
    {
        return await _context.AssetCategories
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
    }

    public async Task<List<AssetCategory>> GetTreeAsync()
    {
        return await _context.AssetCategories
            .Where(c => c.ParentId == null)
            .Include(c => c.Children)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();
    }

    public async Task<AssetCategory?> GetAsync(int id)
    {
        return await _context.AssetCategories
            .Include(c => c.Children)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<AssetCategory> AddAsync(AssetCategory category)
    {
        _context.AssetCategories.Add(category);
        await _context.SaveChangesAsync();
        return category;
    }

    public async Task UpdateAsync(AssetCategory category)
    {
        _context.AssetCategories.Update(category);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var category = await _context.AssetCategories.FindAsync(id);
        if (category != null)
        {
            _context.AssetCategories.Remove(category);
            await _context.SaveChangesAsync();
        }
    }
}
