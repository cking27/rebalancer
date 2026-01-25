namespace rebalancer.Domain;

public interface IPersonRepository
{
    Task<List<Person>> GetAsync();
    Task<Person?> GetAsync(int id);
    Task<Person> AddAsync(Person person);
    Task UpdateAsync(Person person);
    Task DeleteAsync(int id);
}
