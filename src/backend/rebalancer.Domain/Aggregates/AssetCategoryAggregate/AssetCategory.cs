namespace rebalancer.Domain;

public class AssetCategory
{
    public int Id { get; private set; }
    public string Name { get; private set; }
    public int? ParentId { get; private set; }
    public int DisplayOrder { get; private set; }

    public AssetCategory? Parent { get; private set; }
    public ICollection<AssetCategory> Children { get; private set; } = new List<AssetCategory>();

    private AssetCategory()
    {
        Name = string.Empty;
    }

    public AssetCategory(string name, int? parentId, int displayOrder)
    {
        Name = name;
        ParentId = parentId;
        DisplayOrder = displayOrder;
    }

    public AssetCategory(int id, string name, int? parentId, int displayOrder)
    {
        Id = id;
        Name = name;
        ParentId = parentId;
        DisplayOrder = displayOrder;
    }

    public void Update(string name, int? parentId, int displayOrder)
    {
        Name = name;
        ParentId = parentId;
        DisplayOrder = displayOrder;
    }
}
