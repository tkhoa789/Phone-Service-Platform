using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PSP.Domain.Modules.Repair.Entities;

namespace PSP.Infrastructure.Data.Configurations;

public class RepairChecklistConfiguration : IEntityTypeConfiguration<RepairChecklistEntity>
{
    public void Configure(EntityTypeBuilder<RepairChecklistEntity> builder)
    {
        builder.ToTable("RepairChecklists");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Type)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        // Prevent duplicate CheckIn / CheckOut checklists per ticket (Race Condition protection)
        builder.HasIndex(e => new { e.RepairTicketId, e.Type })
            .IsUnique()
            .HasFilter("[IsDeleted] = 0"); // Only enforce uniqueness for active checklists

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        builder.Property(e => e.CustomerSignatureUrl)
            .HasMaxLength(500);

        // Checklist belongs to a RepairTicket
        builder.HasOne(e => e.RepairTicket)
            .WithMany(rt => rt.Checklists)
            .HasForeignKey(e => e.RepairTicketId)
            .OnDelete(DeleteBehavior.Restrict); // Use Restrict because system uses soft deletes, no hard deletes allowed

        // Checklist was inspected by a user
        builder.HasOne(e => e.Inspector)
            .WithMany()
            .HasForeignKey(e => e.InspectorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Checklist has many items
        builder.HasMany(e => e.Items)
            .WithOne(i => i.RepairChecklist)
            .HasForeignKey(i => i.RepairChecklistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RepairChecklistItemConfiguration : IEntityTypeConfiguration<RepairChecklistItemEntity>
{
    public void Configure(EntityTypeBuilder<RepairChecklistItemEntity> builder)
    {
        builder.ToTable("RepairChecklistItems");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.CheckPointName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.IssueDescription)
            .HasMaxLength(1000);
            
        builder.HasOne(e => e.RepairChecklist)
            .WithMany(rc => rc.Items)
            .HasForeignKey(e => e.RepairChecklistId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
