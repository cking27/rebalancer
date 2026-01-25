using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class ModelRepository : IModelRepository
{
    private readonly RebalancerDbContext _context;

    public ModelRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<Model>> GetAsync()
    {
        return await _context.Models
            .Include(m => m.Allocations)
            .ToListAsync();
    }

    public async Task<Model?> GetAsync(int id)
    {
        return await _context.Models.FindAsync(id);
    }

    public async Task<Model?> GetWithAllocationsAsync(int id)
    {
        return await _context.Models
            .Include(m => m.Allocations)
                .ThenInclude(a => a.AssetCategory)
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<Model> AddAsync(Model model)
    {
        _context.Models.Add(model);
        await _context.SaveChangesAsync();
        return model;
    }

    public async Task UpdateAsync(Model model)
    {
        // Remove existing allocations
        var existingAllocations = await _context.ModelAllocations
            .Where(a => a.ModelId == model.Id)
            .ToListAsync();
        _context.ModelAllocations.RemoveRange(existingAllocations);

        // Add new allocations
        _context.Models.Update(model);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var model = await _context.Models
            .Include(m => m.Allocations)
            .FirstOrDefaultAsync(m => m.Id == id);
        if (model != null)
        {
            _context.Models.Remove(model);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<Position>> GetPositionsByAccountIdsAsync(List<int> accountIds)
    {
        return await _context.Positions
            .Include(p => p.AssetCategory)
            .Where(p => accountIds.Contains(p.AccountId))
            .ToListAsync();
    }
}
