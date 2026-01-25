namespace rebalancer.Domain;

public class Model
{
    public int Id { get; private set; }
    public string Name { get; private set; }
    public string? Description { get; private set; }

    public ICollection<ModelAllocation> Allocations { get; private set; } = new List<ModelAllocation>();

    private Model()
    {
        Name = string.Empty;
    }

    public Model(string name, string? description)
    {
        Name = name;
        Description = description;
    }

    public Model(int id, string name, string? description)
    {
        Id = id;
        Name = name;
        Description = description;
    }

    public void Update(string name, string? description)
    {
        Name = name;
        Description = description;
    }

    public void SetAllocations(IEnumerable<ModelAllocation> allocations)
    {
        Allocations.Clear();
        foreach (var allocation in allocations)
        {
            Allocations.Add(allocation);
        }
    }
}
