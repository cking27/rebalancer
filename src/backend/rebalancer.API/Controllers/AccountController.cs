using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("[controller]")]
public class AccountController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Vanguard IRA CRK", "Vanguard IRA HTK", "Ch8ly", "8", "88", "88", "88", "88", "Sw7e888l2tering", "Scorc872hing"
    };

    private readonly ILogger<AccountController> _logger;

    public AccountController(ILogger<AccountController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "GetAccount")]
    public IEnumerable<Account> Get()
    {
        _logger.LogInformation("Getting GetAccount");
        System.Console.WriteLine("Getting GetAccount");
        // return back a list of accounts with dummy data
        var rng = new Random(); 
        return Enumerable.Range(1, 5).Select(index => new Account(index, Summaries[rng.Next(Summaries.Length)]))
            .ToArray();
    }
}
