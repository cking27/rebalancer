using Microsoft.AspNetCore.Mvc;
using rebalancer.API.Services;
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

        var holdings = await _modelRepository.GetHoldingsByAccountIdsAsync(request.AccountIds);
        var allCategories = await _categoryRepository.GetAsync();

        return Ok(CompareService.Compare(model, holdings, allCategories));
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
    public List<UnmappedHoldingDto> UnmappedHoldings { get; set; } = new();
    public List<AccountBreakdownDto> AccountBreakdowns { get; set; } = new();
}

public class AccountBreakdownDto
{
    public int AccountId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public decimal AccountValue { get; set; }
    public decimal PercentOfTotal { get; set; }
    public List<AccountCategoryComparisonDto> CategoryComparisons { get; set; } = new();
    public List<HoldingRecommendationDto> HoldingRecommendations { get; set; } = new();
}

public class AccountCategoryComparisonDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal TargetPercentage { get; set; }
    public decimal ActualPercentage { get; set; }
    public decimal TargetValue { get; set; }
    public decimal ActualValue { get; set; }
    public decimal DifferenceValue { get; set; }
    public int Depth { get; set; }
    public bool IsLeaf { get; set; }
}

public class HoldingRecommendationDto
{
    public int HoldingId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string SecurityName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal SuggestedChange { get; set; }
    public string Recommendation { get; set; } = string.Empty;
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

public class UnmappedHoldingDto
{
    public int HoldingId { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string SecurityName { get; set; } = string.Empty;
    public decimal Value { get; set; }
}
