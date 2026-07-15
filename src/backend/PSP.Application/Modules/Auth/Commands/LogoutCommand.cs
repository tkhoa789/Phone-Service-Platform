using MediatR;

namespace PSP.Application.Modules.Auth.Commands;

/// <summary>
/// =====================================================================
/// LỆNH ĐĂNG XUẤT (LogoutCommand)
/// =====================================================================
/// 
/// Khi người dùng bấm nút "Đăng xuất" trên giao diện:
///   1. Client gửi Refresh Token hiện tại lên server.
///   2. Server thu hồi (revoke) token đó → token không dùng lại được nữa.
///   3. Client tự xóa Access Token và Refresh Token khỏi bộ nhớ trình duyệt.
///
/// TẠI SAO PHẢI GỬI REFRESH TOKEN KHI ĐĂNG XUẤT?
/// -----------------------------------------------
/// Access Token (JWT) là "stateless" (server không lưu trạng thái).
/// → Server KHÔNG THỂ "hủy" một JWT đã phát ra (trừ khi dùng blacklist phức tạp).
/// → Nhưng server CÓ THỂ thu hồi Refresh Token (vì nó được lưu trong Database).
/// → Khi Refresh Token bị thu hồi, kẻ xấu không thể xin cấp Access Token mới.
/// =====================================================================
/// </summary>
public record LogoutCommand(string RefreshToken) : IRequest<bool>;
