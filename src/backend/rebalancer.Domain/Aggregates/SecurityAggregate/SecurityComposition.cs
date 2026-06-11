namespace rebalancer.Domain;

public class SecurityComposition
{
    public int Id { get; private set; }
    public int SecurityId { get; private set; }
    public int ComponentSecurityId { get; private set; }
    public decimal Percentage { get; private set; }

    public Security? ComponentSecurity { get; private set; }

    private SecurityComposition()
    {
    }

    public SecurityComposition(int securityId, int componentSecurityId, decimal percentage)
    {
        SecurityId = securityId;
        ComponentSecurityId = componentSecurityId;
        Percentage = percentage;
    }

    public void Update(decimal percentage)
    {
        Percentage = percentage;
    }
}
