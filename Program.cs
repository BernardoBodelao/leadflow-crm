
using GestaoLeads.Api.Data;
using GestaoLeads.Api.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<LeadDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

string[] statusPermitidos =
{
    "Novo",
    "Em contato",
    "Interessado",
    "Convertido",
    "Perdido"
};

// Consultar todos os leads
app.MapGet("/api/leads", async (LeadDbContext db) =>
    await db.Leads.OrderBy(l => l.Id).ToListAsync());

// Consultar um lead pelo ID
app.MapGet("/api/leads/{id:int}", async (int id, LeadDbContext db) =>
{
    var lead = await db.Leads.FindAsync(id);

    return lead is null
        ? Results.NotFound()
        : Results.Ok(lead);
});

// Cadastrar um lead
app.MapPost("/api/leads", async (
    CriarLeadRequest request,
    LeadDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(request.Nome) ||
        string.IsNullOrWhiteSpace(request.Telefone))
    {
        return Results.BadRequest(new
        {
            mensagem = "Nome e telefone são obrigatórios."
        });
    }

    if (string.IsNullOrWhiteSpace(request.Status) ||
        !statusPermitidos.Contains(request.Status))
    {
        return Results.BadRequest(new
        {
            mensagem = "Status inválido."
        });
    }

    var lead = new Lead
    {
        Nome = request.Nome.Trim(),
        Telefone = request.Telefone.Trim(),
        Origem = request.Origem?.Trim() ?? "",
        Status = request.Status,
        CriadoEm = DateTime.Now
    };

    db.Leads.Add(lead);
    await db.SaveChangesAsync();

    return Results.Created($"/api/leads/{lead.Id}", lead);
});

// Editar um lead
app.MapPut("/api/leads/{id:int}", async (
    int id,
    CriarLeadRequest request,
    LeadDbContext db) =>
{
    var lead = await db.Leads.FindAsync(id);

    if (lead is null)
        return Results.NotFound();

    if (string.IsNullOrWhiteSpace(request.Nome) ||
        string.IsNullOrWhiteSpace(request.Telefone))
    {
        return Results.BadRequest(new
        {
            mensagem = "Nome e telefone são obrigatórios."
        });
    }

    if (string.IsNullOrWhiteSpace(request.Status) ||
        !statusPermitidos.Contains(request.Status))
    {
        return Results.BadRequest(new
        {
            mensagem = "Status inválido."
        });
    }

    lead.Nome = request.Nome.Trim();
    lead.Telefone = request.Telefone.Trim();
    lead.Origem = request.Origem?.Trim() ?? "";
    lead.Status = request.Status;

    await db.SaveChangesAsync();

    return Results.Ok(lead);
});

// Excluir um lead
app.MapDelete("/api/leads/{id:int}", async (
    int id,
    LeadDbContext db) =>
{
    var lead = await db.Leads.FindAsync(id);

    if (lead is null)
        return Results.NotFound();

    db.Leads.Remove(lead);
    await db.SaveChangesAsync();

    return Results.NoContent();
});

app.Run();

record CriarLeadRequest(
    string Nome,
    string Telefone,
    string? Origem,
    string Status
);
