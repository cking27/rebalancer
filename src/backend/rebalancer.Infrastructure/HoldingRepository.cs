using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class HoldingRepository : IHoldingRepository
{
    private readonly RebalancerDbContext _context;

    public HoldingRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<Holding>> GetAsync()
    {
        return await _context.Holdings
            .Include(h => h.Account)
            .Include(h => h.Security)
                .ThenInclude(s => s!.AssetCategory)
            .ToListAsync();
    }

    public async Task<List<Holding>> GetByAccountIdAsync(int accountId)
    {
        return await _context.Holdings
            .Include(h => h.Security)
                .ThenInclude(s => s!.AssetCategory)
            .Where(h => h.AccountId == accountId)
            .ToListAsync();
    }

    public async Task<Holding?> GetAsync(int id)
    {
        return await _context.Holdings
            .Include(h => h.Account)
            .Include(h => h.Security)
                .ThenInclude(s => s!.AssetCategory)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<Holding> AddAsync(Holding holding)
    {
        _context.Holdings.Add(holding);
        await _context.SaveChangesAsync();
        return holding;
    }

    public async Task UpdateAsync(Holding holding)
    {
        _context.Holdings.Update(holding);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var holding = await _context.Holdings.FindAsync(id);
        if (holding != null)
        {
            _context.Holdings.Remove(holding);
            await _context.SaveChangesAsync();
        }
    }
}
