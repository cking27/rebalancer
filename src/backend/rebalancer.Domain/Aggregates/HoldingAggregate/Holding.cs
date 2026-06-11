namespace rebalancer.Domain;

public class Holding
{
    public int Id { get; private set; }
    public int AccountId { get; private set; }
    public int SecurityId { get; private set; }
    public decimal Shares { get; private set; }

    public Account? Account { get; private set; }
    public Security? Security { get; private set; }

    // Computed property - requires Security to be loaded
    public decimal Value => Shares * (Security?.Price ?? 0);

    private Holding()
    {
    }

    public Holding(int accountId, int securityId, decimal shares)
    {
        AccountId = accountId;
        SecurityId = securityId;
        Shares = shares;
    }

    public Holding(int id, int accountId, int securityId, decimal shares)
    {
        Id = id;
        AccountId = accountId;
        SecurityId = securityId;
        Shares = shares;
    }

    public void Update(int securityId, decimal shares)
    {
        SecurityId = securityId;
        Shares = shares;
    }
}
