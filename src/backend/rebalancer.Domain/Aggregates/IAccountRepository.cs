// Path: src/backend/rebalancer.Domain/Repositories/IAccountRepository.cs
using System.Collections.Generic; // Add this line
using System.Threading.Tasks; // Add this line
namespace rebalancer.Domain;
public interface IAccountRepository
{
    Task<List<Account>> GetAsync();
    Task<Account> GetAsync(int id);
    Task AddAsync(Account account);
    Task UpdateAsync(Account account);
    Task DeleteAsync(int id);
}
