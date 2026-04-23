using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SecurityController : ControllerBase
{
    private readonly ISecurityRepository _securityRepository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SecurityController> _logger;

    public SecurityController(
        ISecurityRepository securityRepository,
        IHttpClientFactory httpClientFactory,
        ILogger<SecurityController> logger)
    {
        _securityRepository = securityRepository;
        _httpClientFactory = httpClientFactory;
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

    [HttpPost("refresh-prices")]
    public async Task<ActionResult<RefreshPricesResponse>> RefreshPrices()
    {
        var securities = await _securityRepository.GetAsync();
        var results = new List<PriceUpdateResult>();
        var client = _httpClientFactory.CreateClient("YahooFinance");

        foreach (var security in securities)
        {
            try
            {
                var price = await FetchPriceFromYahoo(client, security.Ticker);
                if (price.HasValue)
                {
                    security.Update(
                        security.Ticker,
                        security.Name,
                        security.PositionType,
                        security.AssetClass,
                        security.AssetCategoryId,
                        price.Value
                    );
                    await _securityRepository.UpdateAsync(security);
                    results.Add(new PriceUpdateResult
                    {
                        Ticker = security.Ticker,
                        Success = true,
                        OldPrice = security.Price,
                        NewPrice = price.Value
                    });
                }
                else
                {
                    results.Add(new PriceUpdateResult
                    {
                        Ticker = security.Ticker,
                        Success = false,
                        Error = "Could not fetch price"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch price for {Ticker}", security.Ticker);
                results.Add(new PriceUpdateResult
                {
                    Ticker = security.Ticker,
                    Success = false,
                    Error = ex.Message
                });
            }
        }

        return Ok(new RefreshPricesResponse
        {
            UpdatedCount = results.Count(r => r.Success),
            FailedCount = results.Count(r => !r.Success),
            Results = results
        });
    }

    private async Task<decimal?> FetchPriceFromYahoo(HttpClient client, string ticker)
    {
        var url = $"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?interval=1d&range=1d";
        var response = await client.GetAsync(url);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Yahoo Finance returned {StatusCode} for {Ticker}", response.StatusCode, ticker);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var root = doc.RootElement;
        if (root.TryGetProperty("chart", out var chart) &&
            chart.TryGetProperty("result", out var result) &&
            result.GetArrayLength() > 0)
        {
            var firstResult = result[0];
            if (firstResult.TryGetProperty("meta", out var meta) &&
                meta.TryGetProperty("regularMarketPrice", out var priceElement))
            {
                return priceElement.GetDecimal();
            }
        }

        return null;
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

public class RefreshPricesResponse
{
    public int UpdatedCount { get; set; }
    public int FailedCount { get; set; }
    public List<PriceUpdateResult> Results { get; set; } = new();
}

public class PriceUpdateResult
{
    public string Ticker { get; set; } = string.Empty;
    public bool Success { get; set; }
    public decimal OldPrice { get; set; }
    public decimal NewPrice { get; set; }
    public string? Error { get; set; }
}
