
namespace GestaoLeads.Api.Models;

public class Lead
{
    public int Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public string Telefone { get; set; } = string.Empty;

    public string Origem { get; set; } = string.Empty;

    public string Status { get; set; } = "Novo";

    public DateTime CriadoEm { get; set; } = DateTime.Now;
}
