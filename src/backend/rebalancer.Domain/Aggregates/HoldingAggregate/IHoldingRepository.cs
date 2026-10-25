namespace rebalancer.Domain;

public interface IHoldingRepository
{
    Task<List<Holding>> GetAsync();
    Task<List<Holding>> GetByAccountIdAsync(int accountId);
    Task<Holding?> GetAsync(int id);
    Task<Holding> AddAsync(Holding holding);
    Task UpdateAsync(Holding holding);
    Task DeleteAsync(int id);

    /// <summary>
    /// Sets the account's share counts to match <paramref name="sharesBySecurityId"/> in one save,
    /// adding holdings as needed. When <paramref name="removeMissing"/> is set, holdings for other
    /// securities are deleted.
    /// </summary>
    Task SyncAccountAsync(int accountId, IReadOnlyDictionary<int, decimal> sharesBySecurityId, bool removeMissing);
}
