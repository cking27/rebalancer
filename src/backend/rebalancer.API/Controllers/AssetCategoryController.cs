using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssetCategoryController : ControllerBase
{
    private readonly IAssetCategoryRepository _categoryRepository;
    private readonly ILogger<AssetCategoryController> _logger;

    public AssetCategoryController(IAssetCategoryRepository categoryRepository, ILogger<AssetCategoryController> logger)
    {
        _categoryRepository = categoryRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetCategoryDto>>> Get()
    {
        var categories = await _categoryRepository.GetAsync();
        return Ok(categories.Select(c => new AssetCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            ParentId = c.ParentId,
            DisplayOrder = c.DisplayOrder
        }));
    }

    [HttpGet("tree")]
    public async Task<ActionResult<IEnumerable<AssetCategoryTreeDto>>> GetTree()
    {
        var categories = await _categoryRepository.GetTreeAsync();
        return Ok(categories.Select(MapToTreeDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AssetCategoryDto>> Get(int id)
    {
        var category = await _categoryRepository.GetAsync(id);
        if (category == null)
            return NotFound();

        return Ok(new AssetCategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            ParentId = category.ParentId,
            DisplayOrder = category.DisplayOrder
        });
    }

    [HttpPost]
    public async Task<ActionResult<AssetCategoryDto>> Create([FromBody] CreateAssetCategoryRequest request)
    {
        var category = new AssetCategory(
            request.Name,
            request.ParentId,
            request.DisplayOrder
        );

        var created = await _categoryRepository.AddAsync(category);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new AssetCategoryDto
        {
            Id = created.Id,
            Name = created.Name,
            ParentId = created.ParentId,
            DisplayOrder = created.DisplayOrder
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateAssetCategoryRequest request)
    {
        var category = await _categoryRepository.GetAsync(id);
        if (category == null)
            return NotFound();

        category.Update(request.Name, request.ParentId, request.DisplayOrder);
        await _categoryRepository.UpdateAsync(category);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _categoryRepository.DeleteAsync(id);
        return NoContent();
    }

    private static AssetCategoryTreeDto MapToTreeDto(AssetCategory category)
    {
        return new AssetCategoryTreeDto
        {
            Id = category.Id,
            Name = category.Name,
            ParentId = category.ParentId,
            DisplayOrder = category.DisplayOrder,
            Children = category.Children.OrderBy(c => c.DisplayOrder).Select(MapToTreeDto).ToList()
        };
    }
}

public class AssetCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int DisplayOrder { get; set; }
}

public class AssetCategoryTreeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int DisplayOrder { get; set; }
    public List<AssetCategoryTreeDto> Children { get; set; } = new();
}

public class CreateAssetCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateAssetCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int DisplayOrder { get; set; }
}
