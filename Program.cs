
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

// Consulta todos os leads
app.MapGet("/api/leads", async (LeadDbContext db) =>
    await db.Leads.OrderBy(l => l.Id).ToListAsync());

// Consulta um lead pelo ID
app.MapGet("/api/leads/{id:int}", async (int id, LeadDbContext db) =>
{
    var lead = await db.Leads.FindAsync(id);

    return lead is null
        ? Results.NotFound()
        : Results.Ok(lead);
});

// Consulta o histórico de atividades
app.MapGet("/api/historico", async (LeadDbContext db) =>
    await db.Historicos
        .OrderByDescending(h => h.DataHora)
        .ThenByDescending(h => h.Id)
        .ToListAsync());

// Cadastra um lead
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

    db.Historicos.Add(new LeadHistorico
    {
        LeadId = lead.Id,
        NomeLead = lead.Nome,
        Acao = "Cadastro",
        Descricao = $"Lead {lead.Nome} cadastrado."
    });

    await db.SaveChangesAsync();

    return Results.Created($"/api/leads/{lead.Id}", lead);
});

// Edita um lead
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

    var nomeAnterior = lead.Nome;
    var statusAnterior = lead.Status;

    lead.Nome = request.Nome.Trim();
    lead.Telefone = request.Telefone.Trim();
    lead.Origem = request.Origem?.Trim() ?? "";
    lead.Status = request.Status;

    await db.SaveChangesAsync();

    db.Historicos.Add(new LeadHistorico
    {
        LeadId = lead.Id,
        NomeLead = lead.Nome,
        Acao = "Edição",
        Descricao = $"Dados do lead {lead.Nome} atualizados."
    });

    if (statusAnterior != lead.Status)
    {
        db.Historicos.Add(new LeadHistorico
        {
            LeadId = lead.Id,
            NomeLead = lead.Nome,
            Acao = "Alteração de status",
            Descricao =
                $"Status alterado de '{statusAnterior}' para '{lead.Status}'."
        });
    }

    if (nomeAnterior != lead.Nome)
    {
        db.Historicos.Add(new LeadHistorico
        {
            LeadId = lead.Id,
            NomeLead = lead.Nome,
            Acao = "Alteração de nome",
            Descricao =
                $"Nome alterado de '{nomeAnterior}' para '{lead.Nome}'."
        });
    }

    await db.SaveChangesAsync();

    return Results.Ok(lead);
});

// Exclui um lead e preserva o registro no histórico
app.MapDelete("/api/leads/{id:int}", async (
    int id,
    LeadDbContext db) =>
{
    var lead = await db.Leads.FindAsync(id);

    if (lead is null)
        return Results.NotFound();

    db.Historicos.Add(new LeadHistorico
    {
        LeadId = lead.Id,
        NomeLead = lead.Nome,
        Acao = "Exclusão",
        Descricao = $"Lead {lead.Nome} excluído."
    });

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
