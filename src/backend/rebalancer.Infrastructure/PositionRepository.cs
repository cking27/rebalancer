using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class PositionRepository : IPositionRepository
{
    private readonly RebalancerDbContext _context;

    public PositionRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<Position>> GetAsync()
    {
        return await _context.Positions
            .Include(p => p.Account)
            .ToListAsync();
    }

    public async Task<List<Position>> GetByAccountIdAsync(int accountId)
    {
        return await _context.Positions
            .Where(p => p.AccountId == accountId)
            .ToListAsync();
    }

    public async Task<Position?> GetAsync(int id)
    {
        return await _context.Positions
            .Include(p => p.Account)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<Position> AddAsync(Position position)
    {
        _context.Positions.Add(position);
        await _context.SaveChangesAsync();
        return position;
    }

    public async Task UpdateAsync(Position position)
    {
        _context.Positions.Update(position);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var position = await _context.Positions.FindAsync(id);
        if (position != null)
        {
            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();
        }
    }
}
