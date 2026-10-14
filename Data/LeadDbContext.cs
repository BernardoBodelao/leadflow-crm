
using GestaoLeads.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GestaoLeads.Api.Data;

public class LeadDbContext : DbContext
{
    public LeadDbContext(DbContextOptions<LeadDbContext> options)
        : base(options)
    {
    }

    public DbSet<Lead> Leads => Set<Lead>();
}
