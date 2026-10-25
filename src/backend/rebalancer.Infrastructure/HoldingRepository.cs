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

    public async Task SyncAccountAsync(int accountId, IReadOnlyDictionary<int, decimal> sharesBySecurityId, bool removeMissing)
    {
        var existing = await _context.Holdings
            .Where(h => h.AccountId == accountId)
            .ToListAsync();

        foreach (var group in existing.GroupBy(h => h.SecurityId))
        {
            if (sharesBySecurityId.TryGetValue(group.Key, out var shares))
            {
                group.First().Update(group.Key, shares);
                // Collapse any duplicate holdings of the same security into the first
                _context.Holdings.RemoveRange(group.Skip(1));
            }
            else if (removeMissing)
            {
                _context.Holdings.RemoveRange(group);
            }
        }

        var existingSecurityIds = existing.Select(h => h.SecurityId).ToHashSet();
        foreach (var (securityId, shares) in sharesBySecurityId)
        {
            if (!existingSecurityIds.Contains(securityId))
                _context.Holdings.Add(new Holding(accountId, securityId, shares));
        }

        await _context.SaveChangesAsync();
    }
}
