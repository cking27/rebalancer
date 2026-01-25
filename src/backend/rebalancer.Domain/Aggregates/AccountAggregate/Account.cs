namespace rebalancer.Domain;

public class Account
{
    public int Id { get; private set; }
    public string Name { get; private set; }
    public int InstitutionId { get; private set; }
    public int OwnerId { get; private set; }
    public AccountType AccountType { get; private set; }
    public bool IsRetirement { get; private set; }

    public Institution? Institution { get; private set; }
    public Person? Owner { get; private set; }
    public ICollection<Position> Positions { get; private set; } = new List<Position>();

    private Account()
    {
        Name = string.Empty;
    }

    public Account(string name, int institutionId, int ownerId, AccountType accountType, bool isRetirement)
    {
        Name = name;
        InstitutionId = institutionId;
        OwnerId = ownerId;
        AccountType = accountType;
        IsRetirement = isRetirement;
    }

    public Account(int id, string name)
    {
        Id = id;
        Name = name;
    }

    public Account(int id, string name, int institutionId, int ownerId, AccountType accountType, bool isRetirement)
    {
        Id = id;
        Name = name;
        InstitutionId = institutionId;
        OwnerId = ownerId;
        AccountType = accountType;
        IsRetirement = isRetirement;
    }

    public void Update(string name, int institutionId, int ownerId, AccountType accountType, bool isRetirement)
    {
        Name = name;
        InstitutionId = institutionId;
        OwnerId = ownerId;
        AccountType = accountType;
        IsRetirement = isRetirement;
    }
}
