using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AllocationController : ControllerBase
{
    private readonly IAccountRepository _accountRepository;
    private readonly IHoldingRepository _holdingRepository;
    private readonly ILogger<AllocationController> _logger;

    public AllocationController(
        IAccountRepository accountRepository,
        IHoldingRepository holdingRepository,
        ILogger<AllocationController> logger)
    {
        _accountRepository = accountRepository;
        _holdingRepository = holdingRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<AllocationSummaryDto>> GetAllocation([FromQuery] int[]? accountIds)
    {
        var holdings = new List<Holding>();

        if (accountIds != null && accountIds.Length > 0)
        {
            foreach (var accountId in accountIds)
            {
                var accountHoldings = await _holdingRepository.GetByAccountIdAsync(accountId);
                holdings.AddRange(accountHoldings);
            }
        }
        else
        {
            holdings = await _holdingRepository.GetAsync();
        }

        var totalValue = holdings.Sum(h => h.Value);

        var byAssetClass = holdings
            .Where(h => h.Security != null)
            .GroupBy(h => h.Security!.AssetClass)
            .Select(g => new AllocationItemDto
            {
                Category = g.Key.ToString(),
                Value = g.Sum(h => h.Value),
                Percentage = totalValue > 0 ? Math.Round((g.Sum(h => h.Value) / totalValue) * 100, 2) : 0
            })
            .OrderByDescending(a => a.Value)
            .ToList();

        var byPositionType = holdings
            .Where(h => h.Security != null)
            .GroupBy(h => h.Security!.PositionType)
            .Select(g => new AllocationItemDto
            {
                Category = g.Key.ToString(),
                Value = g.Sum(h => h.Value),
                Percentage = totalValue > 0 ? Math.Round((g.Sum(h => h.Value) / totalValue) * 100, 2) : 0
            })
            .OrderByDescending(a => a.Value)
            .ToList();

        var byPosition = holdings
            .Where(h => h.Security != null)
            .GroupBy(h => h.Security!.Ticker)
            .Select(g => new AllocationItemDto
            {
                Category = g.Key,
                Value = g.Sum(h => h.Value),
                Percentage = totalValue > 0 ? Math.Round((g.Sum(h => h.Value) / totalValue) * 100, 2) : 0
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
