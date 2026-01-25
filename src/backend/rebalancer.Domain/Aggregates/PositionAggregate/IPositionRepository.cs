namespace rebalancer.Domain;

public interface IPositionRepository
{
    Task<List<Position>> GetAsync();
    Task<List<Position>> GetByAccountIdAsync(int accountId);
    Task<Position?> GetAsync(int id);
    Task<Position> AddAsync(Position position);
    Task UpdateAsync(Position position);
    Task DeleteAsync(int id);
}
