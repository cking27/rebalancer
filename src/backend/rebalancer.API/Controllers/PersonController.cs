using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonController : ControllerBase
{
    private readonly IPersonRepository _personRepository;
    private readonly ILogger<PersonController> _logger;

    public PersonController(IPersonRepository personRepository, ILogger<PersonController> logger)
    {
        _personRepository = personRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PersonDto>>> Get()
    {
        var people = await _personRepository.GetAsync();
        return Ok(people.Select(p => new PersonDto { Id = p.Id, Name = p.Name }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PersonDto>> Get(int id)
    {
        var person = await _personRepository.GetAsync(id);
        if (person == null)
            return NotFound();

        return Ok(new PersonDto { Id = person.Id, Name = person.Name });
    }

    [HttpPost]
    public async Task<ActionResult<PersonDto>> Create([FromBody] CreatePersonRequest request)
    {
        var person = new Person(request.Name);
        var created = await _personRepository.AddAsync(person);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new PersonDto { Id = created.Id, Name = created.Name });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdatePersonRequest request)
    {
        var person = await _personRepository.GetAsync(id);
        if (person == null)
            return NotFound();

        person.UpdateName(request.Name);
        await _personRepository.UpdateAsync(person);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _personRepository.DeleteAsync(id);
        return NoContent();
    }
}

public class PersonDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CreatePersonRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdatePersonRequest
{
    public string Name { get; set; } = string.Empty;
}
