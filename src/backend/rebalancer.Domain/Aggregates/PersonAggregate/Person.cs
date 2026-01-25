namespace rebalancer.Domain;

public class Person
{
    public int Id { get; private set; }
    public string Name { get; private set; }

    private Person()
    {
        Name = string.Empty;
    }

    public Person(string name)
    {
        Name = name;
    }

    public Person(int id, string name)
    {
        Id = id;
        Name = name;
    }

    public void UpdateName(string name)
    {
        Name = name;
    }
}
