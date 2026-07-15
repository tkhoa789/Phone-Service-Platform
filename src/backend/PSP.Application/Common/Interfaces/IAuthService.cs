namespace PSP.Application.Common.Interfaces;

/// <summary>
/// =====================================================================
/// GIAO DIỆN DỊCH VỤ XÁC THỰC (IAuthService)
/// =====================================================================
/// 
/// Đây là "Bản hợp đồng" (Contract/Interface) cho tất cả các thao tác 
/// phức tạp liên quan đến Xác thực & Phân quyền.
/// 
/// TẠI SAO CẦN FILE NÀY?
/// ---------------------
/// Trong hệ thống Auth, có nhiều thao tác cần truy vấn NHIỀU BẢNG cùng lúc:
///   - Lấy danh sách Role của User (cần JOIN bảng UserRole + Role)
///   - Lấy danh sách Permission (cần JOIN bảng UserRole + RolePermission + Permission)
///   - Lưu/Kiểm tra Refresh Token
///   - Ghi log đăng nhập
///
/// Các bảng nối (UserRoleEntity, RolePermissionEntity) KHÔNG kế thừa BaseEntity,
/// nên KHÔNG thể dùng IRepository&lt;T&gt; chung được.
/// → Ta tạo ra 1 interface riêng biệt chuyên phục vụ Auth.
///
/// NGUYÊN TẮC CLEAN ARCHITECTURE:
/// - Interface này nằm ở tầng Application (tầng giữa).
/// - Lớp triển khai thực tế (AuthService.cs) nằm ở tầng Infrastructure.
/// - Nhờ vậy, Handler chỉ biết đến interface, KHÔNG biết đến Database.
/// =====================================================================
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Lấy danh sách tên Vai trò (Role) của một User.
    /// Ví dụ kết quả: ["Admin", "Manager"]
    /// </summary>
    Task<IList<string>> GetUserRolesAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lấy danh sách mã Quyền hạn (Permission) của một User.
    /// Ví dụ kết quả: ["USER_CREATE", "SALES_VIEW", "INVENTORY_MANAGE"]
    /// </summary>
    Task<IList<string>> GetUserPermissionsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lưu Refresh Token mới vào Database.
    /// Refresh Token giống như "Vé tháng" - dùng để xin cấp lại Access Token mới
    /// khi cái cũ hết hạn, mà không cần nhập lại mật khẩu.
    /// </summary>
    Task SaveRefreshTokenAsync(Guid userId, string token, DateTime expiryDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Kiểm tra xem Refresh Token có hợp lệ không.
    /// Trả về UserId nếu hợp lệ, hoặc Invalid nếu token đã hết hạn / bị thu hồi.
    /// </summary>
    Task<(Guid UserId, bool IsValid)> ValidateRefreshTokenAsync(string token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Thu hồi (Revoke) một Refresh Token cụ thể.
    /// Giống như "Hủy vé tháng" - token này không thể sử dụng lại được nữa.
    /// Được gọi khi: Đăng xuất, hoặc khi cấp token mới (xoay vòng - Token Rotation).
    /// </summary>
    Task RevokeRefreshTokenAsync(string token, CancellationToken cancellationToken = default);

    /// <summary>
    /// Thu hồi TẤT CẢ Refresh Token của một User.
    /// Được gọi khi: Admin khóa tài khoản, hoặc User đổi mật khẩu.
    /// → Buộc tất cả thiết bị phải đăng nhập lại.
    /// </summary>
    Task RevokeAllUserRefreshTokensAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ghi lại lịch sử đăng nhập (thành công hoặc thất bại).
    /// Phục vụ mục đích: Audit (kiểm toán), phát hiện truy cập trái phép.
    /// </summary>
    Task LogLoginAttemptAsync(Guid userId, string? ipAddress, string? userAgent, bool success, CancellationToken cancellationToken = default);
}
