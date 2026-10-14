namespace GestaoLeads.Api.Models;

public class LeadHistorico
{
    public int Id { get; set; }

    public int LeadId { get; set; }

    public string NomeLead { get; set; } = string.Empty;

    public string Acao { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public DateTime DataHora { get; set; } = DateTime.Now;
}
