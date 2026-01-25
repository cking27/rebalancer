using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PositionController : ControllerBase
{
    private readonly IPositionRepository _positionRepository;
    private readonly ILogger<PositionController> _logger;

    public PositionController(IPositionRepository positionRepository, ILogger<PositionController> logger)
    {
        _positionRepository = positionRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PositionDto>>> Get()
    {
        var positions = await _positionRepository.GetAsync();
        return Ok(positions.Select(p => new PositionDto
        {
            Id = p.Id,
            AccountId = p.AccountId,
            Name = p.Name,
            PositionType = p.PositionType.ToString(),
            AssetClass = p.AssetClass.ToString(),
            Value = p.Value
        }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PositionDto>> Get(int id)
    {
        var position = await _positionRepository.GetAsync(id);
        if (position == null)
            return NotFound();

        return Ok(new PositionDto
        {
            Id = position.Id,
            AccountId = position.AccountId,
            Name = position.Name,
            PositionType = position.PositionType.ToString(),
            AssetClass = position.AssetClass.ToString(),
            Value = position.Value
        });
    }

    [HttpGet("account/{accountId}")]
    public async Task<ActionResult<IEnumerable<PositionDto>>> GetByAccount(int accountId)
    {
        var positions = await _positionRepository.GetByAccountIdAsync(accountId);
        return Ok(positions.Select(p => new PositionDto
        {
            Id = p.Id,
            AccountId = p.AccountId,
            Name = p.Name,
            PositionType = p.PositionType.ToString(),
            AssetClass = p.AssetClass.ToString(),
            Value = p.Value
        }));
    }

    [HttpPost]
    public async Task<ActionResult<PositionDto>> Create([FromBody] CreatePositionRequest request)
    {
        if (!Enum.TryParse<PositionType>(request.PositionType, out var positionType))
            return BadRequest("Invalid position type");

        if (!Enum.TryParse<AssetClass>(request.AssetClass, out var assetClass))
            return BadRequest("Invalid asset class");

        var position = new Position(
            request.AccountId,
            request.Name,
            positionType,
            assetClass,
            request.Value
        );

        var created = await _positionRepository.AddAsync(position);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new PositionDto
        {
            Id = created.Id,
            AccountId = created.AccountId,
            Name = created.Name,
            PositionType = created.PositionType.ToString(),
            AssetClass = created.AssetClass.ToString(),
            Value = created.Value
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdatePositionRequest request)
    {
        var position = await _positionRepository.GetAsync(id);
        if (position == null)
            return NotFound();

        if (!Enum.TryParse<PositionType>(request.PositionType, out var positionType))
            return BadRequest("Invalid position type");

        if (!Enum.TryParse<AssetClass>(request.AssetClass, out var assetClass))
            return BadRequest("Invalid asset class");

        position.Update(request.Name, positionType, assetClass, request.Value);
        await _positionRepository.UpdateAsync(position);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _positionRepository.DeleteAsync(id);
        return NoContent();
    }
}

public class PositionDto
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PositionType { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class CreatePositionRequest
{
    public int AccountId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PositionType { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class UpdatePositionRequest
{
    public string Name { get; set; } = string.Empty;
    public string PositionType { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
    public decimal Value { get; set; }
}
