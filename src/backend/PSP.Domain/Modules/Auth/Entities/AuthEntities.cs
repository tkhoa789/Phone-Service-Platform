using PSP.Domain.Common.Entities;
using PSP.Domain.Common.Enums;

namespace PSP.Domain.Modules.Auth.Entities;

/// <summary>
/// Vai trò hệ thống (ADMIN, MANAGER, SALES, INVENTORY, TECHNICIAN).
/// Tham chiếu: ERD.md - Section 3.1.
/// </summary>
public class RoleEntity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Navigation Properties
    public ICollection<UserRoleEntity> UserRoles { get; set; } = new List<UserRoleEntity>();
    public ICollection<RolePermissionEntity> RolePermissions { get; set; } = new List<RolePermissionEntity>();
}

/// <summary>
/// Quyền hạn thao tác (USER_CREATE, SALES_CREATE, INVENTORY_VIEW...).
/// Tham chiếu: ERD.md - Section 3.1.
/// </summary>
public class PermissionEntity : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;

    // Navigation Properties
    public ICollection<RolePermissionEntity> RolePermissions { get; set; } = new List<RolePermissionEntity>();
}

/// <summary>
/// Bảng nối n-n giữa User và Role.
/// </summary>
public class UserRoleEntity
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public UserEntity User { get; set; } = null!;
    public RoleEntity Role { get; set; } = null!;
}

/// <summary>
/// Bảng nối n-n giữa Role và Permission.
/// </summary>
public class RolePermissionEntity
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public RoleEntity Role { get; set; } = null!;
    public PermissionEntity Permission { get; set; } = null!;
}

/// <summary>
/// Refresh Token bảo mật.
/// Tham chiếu: ERD.md - Section 3.1.
/// </summary>
public class RefreshTokenEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public bool Revoked { get; set; } = false;

    // Navigation Properties
    public UserEntity User { get; set; } = null!;
}

/// <summary>
/// Lịch sử đăng nhập.
/// </summary>
public class LoginHistoryEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public LoginStatus Status { get; set; }

    // Navigation Properties
    public UserEntity User { get; set; } = null!;
}

/// <summary>
/// Nhật ký thao tác hệ thống (Audit Log).
/// </summary>
public class AuditLogEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }

    // Navigation Properties
    public UserEntity User { get; set; } = null!;
}
