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
            .Include(s => s.Compositions)
                .ThenInclude(c => c.ComponentSecurity)
            .AsSplitQuery()
            .ToListAsync();
    }

    public async Task<Security?> GetAsync(int id)
    {
        return await _context.Securities
            .Include(s => s.AssetCategory)
            .Include(s => s.Compositions)
                .ThenInclude(c => c.ComponentSecurity)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Security?> GetByTickerAsync(string ticker)
    {
        return await _context.Securities
            .Include(s => s.AssetCategory)
            .Include(s => s.Compositions)
                .ThenInclude(c => c.ComponentSecurity)
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
        var existingCompositions = await _context.SecurityCompositions
            .Where(c => c.SecurityId == security.Id)
            .ToListAsync();
        _context.SecurityCompositions.RemoveRange(existingCompositions);

        _context.Securities.Update(security);
        await _context.SaveChangesAsync();
    }

    public async Task UpdatePriceAsync(int id, decimal price)
    {
        var security = await _context.Securities.FindAsync(id);
        if (security != null)
        {
            security.Update(security.Ticker, security.Name, security.PositionType,
                security.AssetClass, security.AssetCategoryId, price);
            await _context.SaveChangesAsync();
        }
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
