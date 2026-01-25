namespace rebalancer.Domain;

public interface IAccountRepository
{
    Task<List<Account>> GetAsync();
    Task<Account?> GetAsync(int id);
    Task<Account?> GetWithPositionsAsync(int id);
    Task<Account> AddAsync(Account account);
    Task UpdateAsync(Account account);
    Task DeleteAsync(int id);
}
