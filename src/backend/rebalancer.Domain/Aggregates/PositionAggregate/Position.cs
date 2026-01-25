namespace rebalancer.Domain;

public class Position
{
    public int Id { get; private set; }
    public int AccountId { get; private set; }
    public string Name { get; private set; }
    public PositionType PositionType { get; private set; }
    public AssetClass AssetClass { get; private set; }
    public decimal Value { get; private set; }

    public Account? Account { get; private set; }

    private Position()
    {
        Name = string.Empty;
    }

    public Position(int accountId, string name, PositionType positionType, AssetClass assetClass, decimal value)
    {
        AccountId = accountId;
        Name = name;
        PositionType = positionType;
        AssetClass = assetClass;
        Value = value;
    }

    public Position(int id, int accountId, string name, PositionType positionType, AssetClass assetClass, decimal value)
    {
        Id = id;
        AccountId = accountId;
        Name = name;
        PositionType = positionType;
        AssetClass = assetClass;
        Value = value;
    }

    public void Update(string name, PositionType positionType, AssetClass assetClass, decimal value)
    {
        Name = name;
        PositionType = positionType;
        AssetClass = assetClass;
        Value = value;
    }
}
