namespace rebalancer.Domain;

public class ModelAllocation
{
    public int Id { get; private set; }
    public int ModelId { get; private set; }
    public int AssetCategoryId { get; private set; }
    public decimal TargetPercentage { get; private set; }

    public Model? Model { get; private set; }
    public AssetCategory? AssetCategory { get; private set; }

    private ModelAllocation()
    {
    }

    public ModelAllocation(int modelId, int assetCategoryId, decimal targetPercentage)
    {
        ModelId = modelId;
        AssetCategoryId = assetCategoryId;
        TargetPercentage = targetPercentage;
    }

    public ModelAllocation(int id, int modelId, int assetCategoryId, decimal targetPercentage)
    {
        Id = id;
        ModelId = modelId;
        AssetCategoryId = assetCategoryId;
        TargetPercentage = targetPercentage;
    }

    public void Update(decimal targetPercentage)
    {
        TargetPercentage = targetPercentage;
    }
}
