using rebalancer.Domain;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace rebalancer.Infrastructure
{
    public class AccountRepository : IAccountRepository
    {
        public Task<List<Account>> GetAsync()
        {
         // return back dummy data
            return Task.FromResult(new List<Account>
            {
                new Account(1, "dummy"),
                new Account(2, "dummy"),
                new Account(3, "dummy")
            });  

        }

        public Task<Account> GetAsync(int id)
        {
            // TODO: Implement logic to retrieve an account by id from the database

            return Task.FromResult(new Account(1, "dummy"));
        }

        public Task AddAsync(Account account)
        {
            // TODO: Implement logic to add an account to the database

            throw new NotImplementedException();
        }

        public Task UpdateAsync(Account account)
        {
            // TODO: Implement logic to update an account in the database

            throw new NotImplementedException();
        }

        public Task DeleteAsync(int id)
        {
            // TODO: Implement logic to delete an account from the database

            throw new NotImplementedException();
        }
    }
}
