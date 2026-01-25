using Microsoft.AspNetCore.Mvc;
using rebalancer.Domain;

namespace rebalancer.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstitutionController : ControllerBase
{
    private readonly IInstitutionRepository _institutionRepository;
    private readonly ILogger<InstitutionController> _logger;

    public InstitutionController(IInstitutionRepository institutionRepository, ILogger<InstitutionController> logger)
    {
        _institutionRepository = institutionRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InstitutionDto>>> Get()
    {
        var institutions = await _institutionRepository.GetAsync();
        return Ok(institutions.Select(i => new InstitutionDto { Id = i.Id, Name = i.Name }));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InstitutionDto>> Get(int id)
    {
        var institution = await _institutionRepository.GetAsync(id);
        if (institution == null)
            return NotFound();

        return Ok(new InstitutionDto { Id = institution.Id, Name = institution.Name });
    }

    [HttpPost]
    public async Task<ActionResult<InstitutionDto>> Create([FromBody] CreateInstitutionRequest request)
    {
        var institution = new Institution(request.Name);
        var created = await _institutionRepository.AddAsync(institution);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, new InstitutionDto { Id = created.Id, Name = created.Name });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateInstitutionRequest request)
    {
        var institution = await _institutionRepository.GetAsync(id);
        if (institution == null)
            return NotFound();

        institution.UpdateName(request.Name);
        await _institutionRepository.UpdateAsync(institution);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await _institutionRepository.DeleteAsync(id);
        return NoContent();
    }
}

public class InstitutionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CreateInstitutionRequest
{
    public string Name { get; set; } = string.Empty;
}

public class UpdateInstitutionRequest
{
    public string Name { get; set; } = string.Empty;
}
