using Microsoft.EntityFrameworkCore;
using PSP.Application.Common.Interfaces;
using PSP.Domain.Common.Enums;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Infrastructure.Data;

namespace PSP.Infrastructure.Services.Auth;

/// <summary>
/// =====================================================================
/// TRIỂN KHAI DỊCH VỤ XÁC THỰC (AuthService)
/// =====================================================================
/// 
/// Đây là "Thợ thực thi" cho bản hợp đồng IAuthService.
/// 
/// File này nằm ở tầng Infrastructure (tầng ngoài cùng bên dưới), 
/// nên được phép dùng trực tiếp AppDbContext để truy vấn Database.
///
/// QUAN TRỌNG: Các Handler ở tầng Application KHÔNG BAO GIỜ gọi trực tiếp 
/// file này. Chúng chỉ gọi thông qua interface IAuthService.
/// → Đây chính là nguyên tắc "Dependency Inversion" trong SOLID.
/// =====================================================================
/// </summary>
public class AuthService : IAuthService
{
    private readonly AppDbContext _context;

    /// <summary>
    /// Constructor: Hệ thống DI (Dependency Injection) tự động "tiêm" 
    /// AppDbContext vào đây khi ứng dụng khởi chạy.
    /// </summary>
    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách Role của User.
    /// 
    /// Quy trình truy vấn (SQL tương đương):
    ///   SELECT r.Name 
    ///   FROM UserRoles ur 
    ///   INNER JOIN Roles r ON ur.RoleId = r.Id 
    ///   WHERE ur.UserId = @userId AND r.IsDeleted = false
    /// </summary>
    public async Task<IList<string>> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        // Bước 1: Vào bảng nối UserRoles, lọc ra những dòng có UserId trùng khớp.
        // Bước 2: Nhảy sang bảng Roles (thông qua Navigation Property "Role").
        // Bước 3: Chỉ lấy những Role chưa bị xóa mềm.
        // Bước 4: Lấy ra tên Role (chuỗi string).
        return await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Join(
                _context.Roles.Where(r => !r.IsDeleted),  // Chỉ lấy Role còn hoạt động
                ur => ur.RoleId,
                r => r.Id,
                (ur, r) => r.Name                          // Chỉ lấy tên Role
            )
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lấy danh sách Permission (Quyền hạn) của User.
    /// 
    /// Luồng truy vấn phức tạp hơn vì phải đi qua 3 bảng:
    ///   User → UserRole → RolePermission → Permission
    ///
    /// SQL tương đương:
    ///   SELECT DISTINCT p.Code 
    ///   FROM UserRoles ur
    ///   INNER JOIN RolePermissions rp ON ur.RoleId = rp.RoleId
    ///   INNER JOIN Permissions p ON rp.PermissionId = p.Id
    ///   WHERE ur.UserId = @userId AND p.IsDeleted = false
    /// </summary>
    public async Task<IList<string>> GetUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        // Bước 1: Lấy tất cả RoleId mà User này được gán.
        var roleIds = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.RoleId)
            .ToListAsync(cancellationToken);

        // Bước 2: Từ danh sách RoleId, tìm tất cả PermissionId tương ứng.
        // Bước 3: Join với bảng Permissions để lấy mã quyền (Code).
        // Bước 4: Dùng Distinct() để loại bỏ quyền trùng lặp 
        //         (vì 1 User có thể có nhiều Role, và nhiều Role cùng có chung 1 Permission).
        return await _context.RolePermissions
            .Where(rp => roleIds.Contains(rp.RoleId))
            .Join(
                _context.Permissions.Where(p => !p.IsDeleted),
                rp => rp.PermissionId,
                p => p.Id,
                (rp, p) => p.Code
            )
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Lưu Refresh Token mới vào Database.
    /// </summary>
    public async Task SaveRefreshTokenAsync(Guid userId, string token, DateTime expiryDate, CancellationToken cancellationToken = default)
    {
        var refreshToken = new RefreshTokenEntity
        {
            UserId = userId,
            Token = token,
            ExpiryDate = expiryDate,
            Revoked = false
        };

        await _context.RefreshTokens.AddAsync(refreshToken, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Kiểm tra Refresh Token có hợp lệ không.
    /// 
    /// Token hợp lệ khi thỏa MÃN CẢ 3 điều kiện:
    ///   1. Tồn tại trong Database (không bị xóa).
    ///   2. Chưa bị thu hồi (Revoked == false).
    ///   3. Chưa hết hạn (ExpiryDate > bây giờ).
    /// </summary>
    public async Task<(Guid UserId, bool IsValid)> ValidateRefreshTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(
                rt => rt.Token == token && !rt.Revoked && !rt.IsDeleted,
                cancellationToken
            );

        // Nếu không tìm thấy hoặc đã hết hạn → Không hợp lệ
        if (refreshToken == null || refreshToken.ExpiryDate <= DateTime.UtcNow)
        {
            return (Guid.Empty, false);
        }

        return (refreshToken.UserId, true);
    }

    /// <summary>
    /// Thu hồi 1 Refresh Token cụ thể.
    /// Kỹ thuật: Đánh dấu Revoked = true, token này vĩnh viễn không dùng lại được.
    /// </summary>
    public async Task RevokeRefreshTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        var refreshToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token && !rt.Revoked, cancellationToken);

        if (refreshToken != null)
        {
            refreshToken.Revoked = true;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    /// <summary>
    /// Thu hồi TẤT CẢ Refresh Token của 1 User.
    /// Dùng khi: Admin khóa tài khoản, User đổi mật khẩu, hoặc nghi ngờ bị hack.
    /// → Mọi thiết bị đều bị "đá" ra, phải đăng nhập lại.
    /// </summary>
    public async Task RevokeAllUserRefreshTokensAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.Revoked)
            .ToListAsync(cancellationToken);

        foreach (var token in tokens)
        {
            token.Revoked = true;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Ghi log đăng nhập vào bảng LoginHistory.
    /// Mỗi lần ai đó đăng nhập (dù thành công hay thất bại) đều được ghi nhận.
    /// → Phục vụ audit (kiểm toán) và phát hiện tấn công brute-force.
    /// </summary>
    public async Task LogLoginAttemptAsync(Guid userId, string? ipAddress, string? userAgent, bool success, CancellationToken cancellationToken = default)
    {
        var log = new LoginHistoryEntity
        {
            UserId = userId,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Status = success ? LoginStatus.Success : LoginStatus.Failed
        };

        await _context.LoginHistories.AddAsync(log, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
