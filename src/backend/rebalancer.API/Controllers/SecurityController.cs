using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SecurityController : ControllerBase
{
    private readonly ISecurityRepository _securityRepository;
    private readonly ILogger<SecurityController> _logger;

    public SecurityController(ISecurityRepository securityRepository, ILogger<SecurityController> logger)
    {
        _securityRepository = securityRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SecurityDto>>> Get()
    {
        var securities = await _securityRepository.GetAsync();
        return Ok(securities.Select(s => new SecurityDto
        {
            Id = s.Id,
            Ticker = s.Ticker,
            Name = s.Name,
            PositionType = s.PositionType.ToString(),
            AssetClass = s.AssetClass.ToString(),
            AssetCategoryId = s.AssetCategoryId,
            AssetCategoryName = s.AssetCategory?.Name,
            Price = s.Price
        }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SecurityDto>> Get(int id)
    {
        var security = await _securityRepository.GetAsync(id);
        if (security == null)
            return NotFound();

        return Ok(new SecurityDto
        {
            Id = security.Id,
            Ticker = security.Ticker,
            Name = security.Name,
            PositionType = security.PositionType.ToString(),
            AssetClass = security.AssetClass.ToString(),
            AssetCategoryId = security.AssetCategoryId,
            AssetCategoryName = security.AssetCategory?.Name,
            Price = security.Price
        });
    }

    [HttpGet("ticker/{ticker}")]
    public async Task<ActionResult<SecurityDto>> GetByTicker(string ticker)
    {
        var security = await _securityRepository.GetByTickerAsync(ticker);
        if (security == null)
            return NotFound();

        return Ok(new SecurityDto
        {
            Id = security.Id,
            Ticker = security.Ticker,
            Name = security.Name,
            PositionType = security.PositionType.ToString(),
            AssetClass = security.AssetClass.ToString(),
            AssetCategoryId = security.AssetCategoryId,
            AssetCategoryName = security.AssetCategory?.Name,
            Price = security.Price
        });
    }

    [HttpPost]
    public async Task<ActionResult<SecurityDto>> Create([FromBody] CreateSecurityRequest request)
    {
        if (!Enum.TryParse<PositionType>(request.PositionType, out var positionType))
            return BadRequest("Invalid position type");

        if (!Enum.TryParse<AssetClass>(request.AssetClass, out var assetClass))
            return BadRequest("Invalid asset class");

        var security = new Security(
            request.Ticker,
            request.Name,
            positionType,
            assetClass,
            request.AssetCategoryId,
            request.Price
        );

        var created = await _securityRepository.AddAsync(security);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new SecurityDto
        {
            Id = created.Id,
            Ticker = created.Ticker,
            Name = created.Name,
            PositionType = created.PositionType.ToString(),
            AssetClass = created.AssetClass.ToString(),
            AssetCategoryId = created.AssetCategoryId,
            AssetCategoryName = null,
            Price = created.Price
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateSecurityRequest request)
    {
        var security = await _securityRepository.GetAsync(id);
        if (security == null)
            return NotFound();

        if (!Enum.TryParse<PositionType>(request.PositionType, out var positionType))
            return BadRequest("Invalid position type");

        if (!Enum.TryParse<AssetClass>(request.AssetClass, out var assetClass))
            return BadRequest("Invalid asset class");

        security.Update(request.Ticker, request.Name, positionType, assetClass, request.AssetCategoryId, request.Price);
        await _securityRepository.UpdateAsync(security);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _securityRepository.DeleteAsync(id);
        return NoContent();
    }
}

public class SecurityDto
{
    public int Id { get; set; }
    public string Ticker { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PositionType { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
    public int? AssetCategoryId { get; set; }
    public string? AssetCategoryName { get; set; }
    public decimal Price { get; set; }
}

public class CreateSecurityRequest
{
    public string Ticker { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PositionType { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
    public int? AssetCategoryId { get; set; }
    public decimal Price { get; set; }
}

public class UpdateSecurityRequest
{
    public string Ticker { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string PositionType { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
    public int? AssetCategoryId { get; set; }
    public decimal Price { get; set; }
}
