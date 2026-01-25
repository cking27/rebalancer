namespace rebalancer.Domain;

public interface IInstitutionRepository
{
    Task<List<Institution>> GetAsync();
    Task<Institution?> GetAsync(int id);
    Task<Institution> AddAsync(Institution institution);
    Task UpdateAsync(Institution institution);
    Task DeleteAsync(int id);
}
