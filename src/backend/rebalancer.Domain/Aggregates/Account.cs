namespace rebalancer.Domain;
public class Account
{

    public int Id { get; private set; }
    public string Name { get; private set; }

    public Account(int id, string name)
    {
        Id = id;
        Name = name;
    }

}

