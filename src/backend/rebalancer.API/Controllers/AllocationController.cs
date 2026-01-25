using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AllocationController : ControllerBase
{
    private readonly IAccountRepository _accountRepository;
    private readonly IPositionRepository _positionRepository;
    private readonly ILogger<AllocationController> _logger;

    public AllocationController(
        IAccountRepository accountRepository,
        IPositionRepository positionRepository,
        ILogger<AllocationController> logger)
    {
        _accountRepository = accountRepository;
        _positionRepository = positionRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<AllocationSummaryDto>> GetAllocation([FromQuery] int[]? accountIds)
    {
        var positions = new List<Position>();

        if (accountIds != null && accountIds.Length > 0)
        {
            foreach (var accountId in accountIds)
            {
                var accountPositions = await _positionRepository.GetByAccountIdAsync(accountId);
                positions.AddRange(accountPositions);
            }
        }
        else
        {
            positions = await _positionRepository.GetAsync();
        }

        var totalValue = positions.Sum(p => p.Value);

        var byAssetClass = positions
            .GroupBy(p => p.AssetClass)
            .Select(g => new AllocationItemDto
            {
                Category = g.Key.ToString(),
                Value = g.Sum(p => p.Value),
                Percentage = totalValue > 0 ? Math.Round((g.Sum(p => p.Value) / totalValue) * 100, 2) : 0
            })
            .OrderByDescending(a => a.Value)
            .ToList();

        var byPositionType = positions
            .GroupBy(p => p.PositionType)
            .Select(g => new AllocationItemDto
            {
                Category = g.Key.ToString(),
                Value = g.Sum(p => p.Value),
                Percentage = totalValue > 0 ? Math.Round((g.Sum(p => p.Value) / totalValue) * 100, 2) : 0
            })
            .OrderByDescending(a => a.Value)
            .ToList();

        var byPosition = positions
            .GroupBy(p => p.Name)
            .Select(g => new AllocationItemDto
            {
                Category = g.Key,
                Value = g.Sum(p => p.Value),
                Percentage = totalValue > 0 ? Math.Round((g.Sum(p => p.Value) / totalValue) * 100, 2) : 0
            })
            .OrderByDescending(a => a.Value)
            .ToList();

        return Ok(new AllocationSummaryDto
        {
            TotalValue = totalValue,
            ByAssetClass = byAssetClass,
            ByPositionType = byPositionType,
            ByPosition = byPosition
        });
    }
}

public class AllocationSummaryDto
{
    public decimal TotalValue { get; set; }
    public List<AllocationItemDto> ByAssetClass { get; set; } = new();
    public List<AllocationItemDto> ByPositionType { get; set; } = new();
    public List<AllocationItemDto> ByPosition { get; set; } = new();
}

public class AllocationItemDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public decimal Percentage { get; set; }
}
