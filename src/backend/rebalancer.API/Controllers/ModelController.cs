using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModelController : ControllerBase
{
    private readonly IModelRepository _modelRepository;
    private readonly IAssetCategoryRepository _categoryRepository;
    private readonly ILogger<ModelController> _logger;

    public ModelController(IModelRepository modelRepository, IAssetCategoryRepository categoryRepository, ILogger<ModelController> logger)
    {
        _modelRepository = modelRepository;
        _categoryRepository = categoryRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ModelDto>>> Get()
    {
        var models = await _modelRepository.GetAsync();
        return Ok(models.Select(m => new ModelDto
        {
            Id = m.Id,
            Name = m.Name,
            Description = m.Description,
            Allocations = m.Allocations.Select(a => new ModelAllocationDto
            {
                Id = a.Id,
                AssetCategoryId = a.AssetCategoryId,
                AssetCategoryName = a.AssetCategory?.Name,
                TargetPercentage = a.TargetPercentage
            }).ToList()
        }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ModelDto>> Get(int id)
    {
        var model = await _modelRepository.GetWithAllocationsAsync(id);
        if (model == null)
            return NotFound();

        return Ok(new ModelDto
        {
            Id = model.Id,
            Name = model.Name,
            Description = model.Description,
            Allocations = model.Allocations.Select(a => new ModelAllocationDto
            {
                Id = a.Id,
                AssetCategoryId = a.AssetCategoryId,
                AssetCategoryName = a.AssetCategory?.Name,
                TargetPercentage = a.TargetPercentage
            }).ToList()
        });
    }

    [HttpPost]
    public async Task<ActionResult<ModelDto>> Create([FromBody] CreateModelRequest request)
    {
        var model = new Model(request.Name, request.Description);
        var created = await _modelRepository.AddAsync(model);

        // Add allocations
        var allocations = request.Allocations.Select(a =>
            new ModelAllocation(created.Id, a.AssetCategoryId, a.TargetPercentage)).ToList();
        model.SetAllocations(allocations);
        await _modelRepository.UpdateAsync(model);

        return CreatedAtAction(nameof(Get), new { id = created.Id }, new ModelDto
        {
            Id = created.Id,
            Name = created.Name,
            Description = created.Description,
            Allocations = model.Allocations.Select(a => new ModelAllocationDto
            {
                Id = a.Id,
                AssetCategoryId = a.AssetCategoryId,
                TargetPercentage = a.TargetPercentage
            }).ToList()
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateModelRequest request)
    {
        var model = await _modelRepository.GetWithAllocationsAsync(id);
        if (model == null)
            return NotFound();

        model.Update(request.Name, request.Description);

        var allocations = request.Allocations.Select(a =>
            new ModelAllocation(model.Id, a.AssetCategoryId, a.TargetPercentage)).ToList();
        model.SetAllocations(allocations);

        await _modelRepository.UpdateAsync(model);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _modelRepository.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id}/compare")]
    public async Task<ActionResult<CompareResultDto>> Compare(int id, [FromBody] CompareRequest request)
    {
        var model = await _modelRepository.GetWithAllocationsAsync(id);
        if (model == null)
            return NotFound();

        var positions = await _modelRepository.GetPositionsByAccountIdsAsync(request.AccountIds);
        var allCategories = await _categoryRepository.GetAsync();
        var totalValue = positions.Sum(p => p.Value);

        if (totalValue == 0)
        {
            return Ok(new CompareResultDto
            {
                ModelName = model.Name,
                TotalValue = 0,
                Comparisons = new List<CategoryComparisonDto>(),
                UnmappedPositions = positions.Select(p => new UnmappedPositionDto
                {
                    PositionId = p.Id,
                    PositionName = p.Name,
                    Value = p.Value
                }).ToList()
            });
        }

        // Build a lookup of category by id
        var categoryById = allCategories.ToDictionary(c => c.Id);

        // Build a lookup of allocations by category id
        var allocationByCategoryId = model.Allocations.ToDictionary(a => a.AssetCategoryId, a => a.TargetPercentage);

        // Calculate effective percentage for a category by walking up the parent chain
        // Child percentages are relative to parent, so we multiply through the hierarchy
        decimal GetEffectivePercentage(int categoryId)
        {
            if (!allocationByCategoryId.TryGetValue(categoryId, out var percentage))
                return 0;

            // Walk up the parent chain, multiplying percentages
            decimal effective = percentage;
            var current = categoryById.GetValueOrDefault(categoryId);

            while (current?.ParentId != null)
            {
                var parentId = current.ParentId.Value;
                if (allocationByCategoryId.TryGetValue(parentId, out var parentPercentage))
                {
                    // Parent percentage contributes to effective percentage
                    effective = (effective * parentPercentage) / 100;
                }
                current = categoryById.GetValueOrDefault(parentId);
            }

            return effective;
        }

        // Build a lookup of category descendants (including self)
        HashSet<int> GetCategoryAndDescendants(int categoryId)
        {
            var result = new HashSet<int> { categoryId };
            var children = allCategories.Where(c => c.ParentId == categoryId).Select(c => c.Id);
            foreach (var childId in children)
            {
                foreach (var descendant in GetCategoryAndDescendants(childId))
                {
                    result.Add(descendant);
                }
            }
            return result;
        }

        // Group positions by category
        var positionsByCategory = positions
            .Where(p => p.AssetCategoryId.HasValue)
            .GroupBy(p => p.AssetCategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(p => p.Value));

        // Track which categories are covered by model allocations (for unmapped calculation)
        var coveredCategoryIds = new HashSet<int>();

        // Determine which allocations are "leaf" allocations (no child has an allocation)
        var categoriesWithAllocations = new HashSet<int>(allocationByCategoryId.Keys);
        bool IsLeafAllocation(int categoryId)
        {
            var descendants = GetCategoryAndDescendants(categoryId);
            descendants.Remove(categoryId); // exclude self
            return !descendants.Any(d => categoriesWithAllocations.Contains(d));
        }

        var comparisons = new List<CategoryComparisonDto>();
        foreach (var allocation in model.Allocations)
        {
            // Get this category and all its descendants
            var categoryIds = GetCategoryAndDescendants(allocation.AssetCategoryId);
            foreach (var catId in categoryIds)
            {
                coveredCategoryIds.Add(catId);
            }

            // Sum values from all matching categories
            var actualValue = categoryIds
                .Where(catId => positionsByCategory.ContainsKey(catId))
                .Sum(catId => positionsByCategory[catId]);

            var actualPercentage = (actualValue / totalValue) * 100;

            // Calculate effective target percentage (for hierarchical allocations)
            var effectiveTargetPercentage = GetEffectivePercentage(allocation.AssetCategoryId);

            var differencePercentage = actualPercentage - effectiveTargetPercentage;
            var targetValue = (effectiveTargetPercentage / 100) * totalValue;
            var differenceValue = actualValue - targetValue;

            string recommendation;
            var isLeaf = IsLeafAllocation(allocation.AssetCategoryId);

            if (!isLeaf)
            {
                // Parent category - just show informational status
                if (Math.Abs(differencePercentage) < 0.5m)
                    recommendation = "On target";
                else if (differenceValue > 0)
                    recommendation = $"Over by ${Math.Abs(differenceValue):N0}";
                else
                    recommendation = $"Under by ${Math.Abs(differenceValue):N0}";
            }
            else
            {
                // Leaf allocation - give actionable recommendation
                if (differenceValue > 0)
                    recommendation = $"Sell ${Math.Abs(differenceValue):N0}";
                else if (differenceValue < 0)
                    recommendation = $"Buy ${Math.Abs(differenceValue):N0}";
                else
                    recommendation = "On target";
            }

            // Get depth for display ordering
            int GetDepth(int catId)
            {
                int depth = 0;
                var cat = categoryById.GetValueOrDefault(catId);
                while (cat?.ParentId != null)
                {
                    depth++;
                    cat = categoryById.GetValueOrDefault(cat.ParentId.Value);
                }
                return depth;
            }

            comparisons.Add(new CategoryComparisonDto
            {
                CategoryId = allocation.AssetCategoryId,
                CategoryName = allocation.AssetCategory?.Name ?? "Unknown",
                TargetPercentage = effectiveTargetPercentage,
                ActualPercentage = Math.Round(actualPercentage, 2),
                DifferencePercentage = Math.Round(differencePercentage, 2),
                DifferenceValue = Math.Round(differenceValue, 2),
                Recommendation = recommendation,
                ParentId = categoryById.GetValueOrDefault(allocation.AssetCategoryId)?.ParentId,
                Depth = GetDepth(allocation.AssetCategoryId),
                IsLeaf = isLeaf
            });
        }

        // Sort comparisons by hierarchy (parent first, then children)
        comparisons = comparisons.OrderBy(c => c.Depth).ThenBy(c => c.CategoryName).ToList();

        // Unmapped = no category OR category not covered by any model allocation
        var unmappedPositions = positions
            .Where(p => !p.AssetCategoryId.HasValue || !coveredCategoryIds.Contains(p.AssetCategoryId.Value))
            .Select(p => new UnmappedPositionDto
            {
                PositionId = p.Id,
                PositionName = p.Name,
                Value = p.Value
            }).ToList();

        return Ok(new CompareResultDto
        {
            ModelName = model.Name,
            TotalValue = totalValue,
            Comparisons = comparisons,
            UnmappedPositions = unmappedPositions
        });
    }
}

public class ModelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<ModelAllocationDto> Allocations { get; set; } = new();
}

public class ModelAllocationDto
{
    public int Id { get; set; }
    public int AssetCategoryId { get; set; }
    public string? AssetCategoryName { get; set; }
    public decimal TargetPercentage { get; set; }
}

public class CreateModelRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<CreateModelAllocationRequest> Allocations { get; set; } = new();
}

public class CreateModelAllocationRequest
{
    public int AssetCategoryId { get; set; }
    public decimal TargetPercentage { get; set; }
}

public class UpdateModelRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<CreateModelAllocationRequest> Allocations { get; set; } = new();
}

public class CompareRequest
{
    public List<int> AccountIds { get; set; } = new();
}

public class CompareResultDto
{
    public string ModelName { get; set; } = string.Empty;
    public decimal TotalValue { get; set; }
    public List<CategoryComparisonDto> Comparisons { get; set; } = new();
    public List<UnmappedPositionDto> UnmappedPositions { get; set; } = new();
}

public class CategoryComparisonDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal TargetPercentage { get; set; }
    public decimal ActualPercentage { get; set; }
    public decimal DifferencePercentage { get; set; }
    public decimal DifferenceValue { get; set; }
    public string Recommendation { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int Depth { get; set; }
    public bool IsLeaf { get; set; }
}

public class UnmappedPositionDto
{
    public int PositionId { get; set; }
    public string PositionName { get; set; } = string.Empty;
    public decimal Value { get; set; }
}
