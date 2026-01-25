using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAccountRepository _accountRepository;
    private readonly ILogger<AccountController> _logger;

    public AccountController(IAccountRepository accountRepository, ILogger<AccountController> logger)
    {
        _accountRepository = accountRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountDto>>> Get()
    {
        var accounts = await _accountRepository.GetAsync();
        return Ok(accounts.Select(a => new AccountDto
        {
            Id = a.Id,
            Name = a.Name,
            InstitutionId = a.InstitutionId,
            InstitutionName = a.Institution?.Name,
            OwnerId = a.OwnerId,
            OwnerName = a.Owner?.Name,
            AccountType = a.AccountType.ToString(),
            IsRetirement = a.IsRetirement
        }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AccountDto>> Get(int id)
    {
        var account = await _accountRepository.GetAsync(id);
        if (account == null)
            return NotFound();

        return Ok(new AccountDto
        {
            Id = account.Id,
            Name = account.Name,
            InstitutionId = account.InstitutionId,
            InstitutionName = account.Institution?.Name,
            OwnerId = account.OwnerId,
            OwnerName = account.Owner?.Name,
            AccountType = account.AccountType.ToString(),
            IsRetirement = account.IsRetirement
        });
    }

    [HttpGet("{id}/positions")]
    public async Task<ActionResult<AccountWithPositionsDto>> GetWithPositions(int id)
    {
        var account = await _accountRepository.GetWithPositionsAsync(id);
        if (account == null)
            return NotFound();

        return Ok(new AccountWithPositionsDto
        {
            Id = account.Id,
            Name = account.Name,
            InstitutionId = account.InstitutionId,
            InstitutionName = account.Institution?.Name,
            OwnerId = account.OwnerId,
            OwnerName = account.Owner?.Name,
            AccountType = account.AccountType.ToString(),
            IsRetirement = account.IsRetirement,
            Positions = account.Positions.Select(p => new PositionDto
            {
                Id = p.Id,
                AccountId = p.AccountId,
                Name = p.Name,
                PositionType = p.PositionType.ToString(),
                AssetClass = p.AssetClass.ToString(),
                Value = p.Value
            }).ToList()
        });
    }

    [HttpPost]
    public async Task<ActionResult<AccountDto>> Create([FromBody] CreateAccountRequest request)
    {
        if (!Enum.TryParse<AccountType>(request.AccountType, out var accountType))
            return BadRequest("Invalid account type");

        var account = new Account(
            request.Name,
            request.InstitutionId,
            request.OwnerId,
            accountType,
            request.IsRetirement
        );

        var created = await _accountRepository.AddAsync(account);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new AccountDto
        {
            Id = created.Id,
            Name = created.Name,
            InstitutionId = created.InstitutionId,
            OwnerId = created.OwnerId,
            AccountType = created.AccountType.ToString(),
            IsRetirement = created.IsRetirement
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateAccountRequest request)
    {
        var account = await _accountRepository.GetAsync(id);
        if (account == null)
            return NotFound();

        if (!Enum.TryParse<AccountType>(request.AccountType, out var accountType))
            return BadRequest("Invalid account type");

        account.Update(request.Name, request.InstitutionId, request.OwnerId, accountType, request.IsRetirement);
        await _accountRepository.UpdateAsync(account);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _accountRepository.DeleteAsync(id);
        return NoContent();
    }
}

public class AccountDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int InstitutionId { get; set; }
    public string? InstitutionName { get; set; }
    public int OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public string AccountType { get; set; } = string.Empty;
    public bool IsRetirement { get; set; }
}

public class AccountWithPositionsDto : AccountDto
{
    public List<PositionDto> Positions { get; set; } = new();
}

public class CreateAccountRequest
{
    public string Name { get; set; } = string.Empty;
    public int InstitutionId { get; set; }
    public int OwnerId { get; set; }
    public string AccountType { get; set; } = string.Empty;
    public bool IsRetirement { get; set; }
}

public class UpdateAccountRequest
{
    public string Name { get; set; } = string.Empty;
    public int InstitutionId { get; set; }
    public int OwnerId { get; set; }
    public string AccountType { get; set; } = string.Empty;
    public bool IsRetirement { get; set; }
}
