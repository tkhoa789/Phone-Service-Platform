using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Inventory.Entities;

namespace PSP.Domain.Modules.Branch.Entities;

/// <summary>
/// Chi nhánh cửa hàng trong chuỗi.
/// Tham chiếu: ERD.md - Section 3.1 Identity & Authorization Context.
/// </summary>
public class BranchEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public BranchStatus Status { get; set; } = BranchStatus.Active;

    // Navigation Properties
    public ICollection<UserEntity> Users { get; set; } = new List<UserEntity>();
    public ICollection<WarehouseEntity> Warehouses { get; set; } = new List<WarehouseEntity>();
}
