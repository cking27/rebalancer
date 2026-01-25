using Microsoft.EntityFrameworkCore;
using rebalancer.Domain;

namespace rebalancer.Infrastructure;

public class PersonRepository : IPersonRepository
{
    private readonly RebalancerDbContext _context;

    public PersonRepository(RebalancerDbContext context)
    {
        _context = context;
    }

    public async Task<List<Person>> GetAsync()
    {
        return await _context.People.ToListAsync();
    }

    public async Task<Person?> GetAsync(int id)
    {
        return await _context.People.FindAsync(id);
    }

    public async Task<Person> AddAsync(Person person)
    {
        _context.People.Add(person);
        await _context.SaveChangesAsync();
        return person;
    }

    public async Task UpdateAsync(Person person)
    {
        _context.People.Update(person);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var person = await _context.People.FindAsync(id);
        if (person != null)
        {
            _context.People.Remove(person);
            await _context.SaveChangesAsync();
        }
    }
}
