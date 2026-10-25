using Microsoft.AspNetCore.Mvc;
using rebalancer.API.Services;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HoldingController : ControllerBase
{
    private readonly IHoldingRepository _holdingRepository;
    private readonly ISecurityRepository _securityRepository;
    private readonly ILogger<HoldingController> _logger;

    public HoldingController(IHoldingRepository holdingRepository, ISecurityRepository securityRepository, ILogger<HoldingController> logger)
    {
        _holdingRepository = holdingRepository;
        _securityRepository = securityRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HoldingDto>>> Get()
    {
        var holdings = await _holdingRepository.GetAsync();
        return Ok(holdings.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HoldingDto>> Get(int id)
    {
        var holding = await _holdingRepository.GetAsync(id);
        if (holding == null)
            return NotFound();

        return Ok(MapToDto(holding));
    }

    [HttpGet("account/{accountId}")]
    public async Task<ActionResult<IEnumerable<HoldingDto>>> GetByAccount(int accountId)
    {
        var holdings = await _holdingRepository.GetByAccountIdAsync(accountId);
        return Ok(holdings.Select(MapToDto));
    }

    [HttpPost("account/{accountId}/import/preview")]
    public async Task<ActionResult<HoldingImportPreviewDto>> PreviewImport(int accountId, [FromBody] HoldingImportPreviewRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("File is empty");

        var securities = await _securityRepository.GetAsync();
        return Ok(QuickenImportService.Preview(request.Content, securities));
    }

    [HttpPost("account/{accountId}/import")]
    public async Task<ActionResult> ApplyImport(int accountId, [FromBody] HoldingImportApplyRequest request)
    {
        if (request.Items.Any(i => i.Shares <= 0))
            return BadRequest("Shares must be greater than zero");

        if (request.Items.GroupBy(i => i.SecurityId).Any(g => g.Count() > 1))
            return BadRequest("Each security can only appear once");

        var knownIds = (await _securityRepository.GetAsync()).Select(s => s.Id).ToHashSet();
        if (request.Items.Any(i => !knownIds.Contains(i.SecurityId)))
            return BadRequest("Invalid security ID");

        await _holdingRepository.SyncAccountAsync(
            accountId,
            request.Items.ToDictionary(i => i.SecurityId, i => i.Shares),
            request.RemoveMissing);
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<HoldingDto>> Create([FromBody] CreateHoldingRequest request)
    {
        var security = await _securityRepository.GetAsync(request.SecurityId);
        if (security == null)
            return BadRequest("Invalid security ID");

        var holding = new Holding(
            request.AccountId,
            request.SecurityId,
            request.Shares
        );

        var created = await _holdingRepository.AddAsync(holding);

        // Reload to get security info
        var reloaded = await _holdingRepository.GetAsync(created.Id);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, MapToDto(reloaded!));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateHoldingRequest request)
    {
        var holding = await _holdingRepository.GetAsync(id);
        if (holding == null)
            return NotFound();

        var security = await _securityRepository.GetAsync(request.SecurityId);
        if (security == null)
            return BadRequest("Invalid security ID");

        holding.Update(request.SecurityId, request.Shares);
        await _holdingRepository.UpdateAsync(holding);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _holdingRepository.DeleteAsync(id);
        return NoContent();
    }

    private static HoldingDto MapToDto(Holding h) => new HoldingDto
    {
        Id = h.Id,
        AccountId = h.AccountId,
        SecurityId = h.SecurityId,
        Shares = h.Shares,
        Price = h.Security?.Price ?? 0,
        Value = h.Value,
        Ticker = h.Security?.Ticker ?? string.Empty,
        SecurityName = h.Security?.Name ?? string.Empty,
        PositionType = h.Security?.PositionType.ToString() ?? string.Empty,
        AssetClass = h.Security?.AssetClass.ToString() ?? string.Empty,
        AssetCategoryId = h.Security?.AssetCategoryId,
        AssetCategoryName = h.Security?.AssetCategory?.Name
    };
}

public class HoldingDto
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public int SecurityId { get; set; }
    public decimal Shares { get; set; }
    public decimal Price { get; set; }
    public decimal Value { get; set; }
    // Security properties for convenience
    public string Ticker { get; set; } = string.Empty;
    public string SecurityName { get; set; } = string.Empty;
    public string PositionType { get; set; } = string.Empty;
    public string AssetClass { get; set; } = string.Empty;
    public int? AssetCategoryId { get; set; }
    public string? AssetCategoryName { get; set; }
}

public class CreateHoldingRequest
{
    public int AccountId { get; set; }
    public int SecurityId { get; set; }
    public decimal Shares { get; set; }
}

public class HoldingImportPreviewRequest
{
    public string Content { get; set; } = string.Empty;
}

public class HoldingImportPreviewDto
{
    public List<HoldingImportRowDto> Rows { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class HoldingImportRowDto
{
    public int Line { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Ticker { get; set; } = string.Empty;
    public decimal Shares { get; set; }
    // Suggested match; null when no security matched by ticker or name
    public int? SecurityId { get; set; }
}

public class HoldingImportApplyRequest
{
    public List<HoldingImportItem> Items { get; set; } = new();
    // Delete holdings in the account that aren't in Items
    public bool RemoveMissing { get; set; }
}

public class HoldingImportItem
{
    public int SecurityId { get; set; }
    public decimal Shares { get; set; }
}

public class UpdateHoldingRequest
{
    public int SecurityId { get; set; }
    public decimal Shares { get; set; }
}
