using Microsoft.AspNetCore.Mvc;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("[controller]")]
public class AccountController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezings8", "Bra2c8ing", "Ch8ly", "8", "88", "88", "88", "88", "Sw7e888l2tering", "Scorc872hing"
    };

    private readonly ILogger<AccountController> _logger;

    public AccountController(ILogger<AccountController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "GetAccount")]
    public IEnumerable<WeatherForecast> Get()
    {
           _logger.LogInformation("Getting GetAccount");
        System.Console.WriteLine("Getting GetAccount");
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateTime.Now.AddDays(index),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }
}
