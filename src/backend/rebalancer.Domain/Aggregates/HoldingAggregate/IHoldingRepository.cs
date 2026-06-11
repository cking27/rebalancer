namespace rebalancer.Domain;

public interface IHoldingRepository
{
    Task<List<Holding>> GetAsync();
    Task<List<Holding>> GetByAccountIdAsync(int accountId);
    Task<Holding?> GetAsync(int id);
    Task<Holding> AddAsync(Holding holding);
    Task UpdateAsync(Holding holding);
    Task DeleteAsync(int id);
}
