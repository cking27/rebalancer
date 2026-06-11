using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class AccountRepository : IAccountRepository
{
    private readonly RebalancerDbContext _context;

    public AccountRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<Account>> GetAsync()
    {
        return await _context.Accounts
            .Include(a => a.Institution)
            .Include(a => a.Owner)
            .ToListAsync();
    }

    public async Task<Account?> GetAsync(int id)
    {
        return await _context.Accounts
            .Include(a => a.Institution)
            .Include(a => a.Owner)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<Account?> GetWithHoldingsAsync(int id)
    {
        return await _context.Accounts
            .Include(a => a.Institution)
            .Include(a => a.Owner)
            .Include(a => a.Holdings)
                .ThenInclude(h => h.Security)
                    .ThenInclude(s => s!.AssetCategory)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<Account> AddAsync(Account account)
    {
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task UpdateAsync(Account account)
    {
        _context.Accounts.Update(account);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var account = await _context.Accounts.FindAsync(id);
        if (account != null)
        {
            _context.Accounts.Remove(account);
            await _context.SaveChangesAsync();
        }
    }
}
