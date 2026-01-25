namespace rebalancer.Domain;

public interface IAssetCategoryRepository
{
    Task<List<AssetCategory>> GetAsync();
    Task<List<AssetCategory>> GetTreeAsync();
    Task<AssetCategory?> GetAsync(int id);
    Task<AssetCategory> AddAsync(AssetCategory category);
    Task UpdateAsync(AssetCategory category);
    Task DeleteAsync(int id);
}
