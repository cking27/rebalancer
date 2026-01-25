namespace rebalancer.Domain;

public class Institution
{
    public int Id { get; private set; }
    public string Name { get; private set; }

    private Institution()
    {
        Name = string.Empty;
    }

    public Institution(string name)
    {
        Name = name;
    }

    public Institution(int id, string name)
    {
        Id = id;
        Name = name;
    }

    public void UpdateName(string name)
    {
        Name = name;
    }
}
