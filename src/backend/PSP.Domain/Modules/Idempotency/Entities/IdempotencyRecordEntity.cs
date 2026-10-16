using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PSP.Domain.Common.Entities;

namespace PSP.Domain.Modules.Idempotency.Entities;

[Table("IdempotencyRecords")]
public class IdempotencyRecordEntity : BaseEntity
{
    [Required]
    [MaxLength(255)]
    public string IdentityKey { get; set; } = string.Empty; // Format: {UserId}:{BranchId}:{IdempotencyKey}

    [Required]
    [MaxLength(255)]
    public string RequestHash { get; set; } = string.Empty;

    public string ResponseBody { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Path { get; set; } = string.Empty;
}
