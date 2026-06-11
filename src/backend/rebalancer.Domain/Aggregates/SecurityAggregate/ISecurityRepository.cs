namespace rebalancer.Domain;

public interface ISecurityRepository
{
    Task<List<Security>> GetAsync();
    Task<Security?> GetAsync(int id);
    Task<Security?> GetByTickerAsync(string ticker);
    Task<Security> AddAsync(Security security);
    Task UpdateAsync(Security security);
    Task UpdatePriceAsync(int id, decimal price);
    Task DeleteAsync(int id);
}
