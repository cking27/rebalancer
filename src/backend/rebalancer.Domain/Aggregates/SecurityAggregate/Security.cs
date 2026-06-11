namespace rebalancer.Domain;

public class Security
{
    public int Id { get; private set; }
    public string Ticker { get; private set; }
    public string Name { get; private set; }
    public PositionType PositionType { get; private set; }
    public AssetClass AssetClass { get; private set; }
    public int? AssetCategoryId { get; private set; }
    public decimal Price { get; private set; }

    public AssetCategory? AssetCategory { get; private set; }
    public ICollection<Holding> Holdings { get; private set; } = new List<Holding>();
    public ICollection<SecurityComposition> Compositions { get; private set; } = new List<SecurityComposition>();

    private Security()
    {
        Ticker = string.Empty;
        Name = string.Empty;
    }

    public Security(string ticker, string name, PositionType positionType, AssetClass assetClass, int? assetCategoryId = null, decimal price = 0)
    {
        Ticker = ticker;
        Name = name;
        PositionType = positionType;
        AssetClass = assetClass;
        AssetCategoryId = assetCategoryId;
        Price = price;
    }

    public Security(int id, string ticker, string name, PositionType positionType, AssetClass assetClass, int? assetCategoryId = null, decimal price = 0)
    {
        Id = id;
        Ticker = ticker;
        Name = name;
        PositionType = positionType;
        AssetClass = assetClass;
        AssetCategoryId = assetCategoryId;
        Price = price;
    }

    public void Update(string ticker, string name, PositionType positionType, AssetClass assetClass, int? assetCategoryId, decimal price)
    {
        Ticker = ticker;
        Name = name;
        PositionType = positionType;
        AssetClass = assetClass;
        AssetCategoryId = assetCategoryId;
        Price = price;
    }

    public void SetCompositions(IEnumerable<SecurityComposition> compositions)
    {
        Compositions.Clear();
        foreach (var comp in compositions)
            Compositions.Add(comp);
    }
}
