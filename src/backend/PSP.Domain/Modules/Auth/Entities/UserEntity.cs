using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Branch.Entities;

namespace PSP.Domain.Modules.Auth.Entities;

/// <summary>
/// Nhân viên hệ thống.
/// Tham chiếu: ERD.md - Section 3.1, DATABASE_DICTIONARY.md - Section 2.2.
/// </summary>
public class UserEntity : BaseEntity
{
    public Guid BranchId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public UserStatus Status { get; set; } = UserStatus.Active;

    // Navigation Properties
    public BranchEntity Branch { get; set; } = null!;
    public ICollection<UserRoleEntity> UserRoles { get; set; } = new List<UserRoleEntity>();
    public ICollection<RefreshTokenEntity> RefreshTokens { get; set; } = new List<RefreshTokenEntity>();
    public ICollection<LoginHistoryEntity> LoginHistories { get; set; } = new List<LoginHistoryEntity>();
}
