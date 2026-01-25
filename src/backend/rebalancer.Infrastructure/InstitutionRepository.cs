using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class InstitutionRepository : IInstitutionRepository
{
    private readonly RebalancerDbContext _context;

    public InstitutionRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<Institution>> GetAsync()
    {
        return await _context.Institutions.ToListAsync();
    }

    public async Task<Institution?> GetAsync(int id)
    {
        return await _context.Institutions.FindAsync(id);
    }

    public async Task<Institution> AddAsync(Institution institution)
    {
        _context.Institutions.Add(institution);
        await _context.SaveChangesAsync();
        return institution;
    }

    public async Task UpdateAsync(Institution institution)
    {
        _context.Institutions.Update(institution);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var institution = await _context.Institutions.FindAsync(id);
        if (institution != null)
        {
            _context.Institutions.Remove(institution);
            await _context.SaveChangesAsync();
        }
    }
}
