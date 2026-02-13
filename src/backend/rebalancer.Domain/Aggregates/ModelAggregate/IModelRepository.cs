namespace rebalancer.Domain;

public interface IModelRepository
{
    Task<List<Model>> GetAsync();
    Task<Model?> GetAsync(int id);
    Task<Model?> GetWithAllocationsAsync(int id);
    Task<Model> AddAsync(Model model);
    Task UpdateAsync(Model model);
    Task DeleteAsync(int id);
    Task<List<Holding>> GetHoldingsByAccountIdsAsync(List<int> accountIds);
}
