using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class SecurityRepository : ISecurityRepository
{
    private readonly RebalancerDbContext _context;

    public SecurityRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<Security>> GetAsync()
    {
        return await _context.Securities
            .Include(s => s.AssetCategory)
            .ToListAsync();
    }

    public async Task<Security?> GetAsync(int id)
    {
        return await _context.Securities
            .Include(s => s.AssetCategory)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Security?> GetByTickerAsync(string ticker)
    {
        return await _context.Securities
            .Include(s => s.AssetCategory)
            .FirstOrDefaultAsync(s => s.Ticker == ticker);
    }

    public async Task<Security> AddAsync(Security security)
    {
        _context.Securities.Add(security);
        await _context.SaveChangesAsync();
        return security;
    }

    public async Task UpdateAsync(Security security)
    {
        _context.Securities.Update(security);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var security = await _context.Securities.FindAsync(id);
        if (security != null)
        {
            _context.Securities.Remove(security);
            await _context.SaveChangesAsync();
        }
    }
}
