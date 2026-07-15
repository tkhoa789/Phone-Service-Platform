namespace PSP.Application.Modules.Auth.DTOs;

/// <summary>
/// =====================================================================
/// DTO PHẢN HỒI ĐĂNG NHẬP (AuthResponseDto)
/// =====================================================================
/// 
/// "Hộp quà" trả về cho Client sau khi đăng nhập thành công.
/// Bên trong chứa đầy đủ thông tin để Client có thể:
///   1. Gọi các API khác (nhờ AccessToken).
///   2. Gia hạn phiên khi Token hết hạn (nhờ RefreshToken).
///   3. Hiển thị thông tin người dùng lên giao diện.
///
/// Tuân thủ API_CONTRACT.yaml → LoginResponseEnvelope.data
/// =====================================================================
/// </summary>
public class AuthResponseDto
{
    /// <summary>
    /// Access Token (JWT) - "Thẻ ra vào" để gọi API.
    /// Client phải gắn token này vào Header mỗi lần gọi API:
    ///   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    /// </summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// Refresh Token - "Vé tháng" để xin cấp AccessToken mới.
    /// Khi AccessToken hết hạn (mặc định 60 phút), Client gửi RefreshToken 
    /// lên API /auth/refresh-token để nhận AccessToken mới mà KHÔNG cần nhập lại mật khẩu.
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>
    /// Loại Token - luôn là "Bearer" (theo chuẩn OAuth 2.0).
    /// </summary>
    public string TokenType { get; set; } = "Bearer";

    /// <summary>
    /// Thời gian sống của AccessToken (tính bằng giây).
    /// Ví dụ: 3600 = 60 phút.
    /// </summary>
    public int ExpiresIn { get; set; }

    /// <summary>
    /// Thông tin cơ bản của người dùng vừa đăng nhập.
    /// Frontend dùng để hiển thị tên, vai trò lên thanh navigation.
    /// </summary>
    public UserDto User { get; set; } = default!;

    /// <summary>
    /// Danh sách vai trò (Roles) của người dùng.
    /// Ví dụ: ["Admin", "Manager"]
    /// Frontend dùng để ẩn/hiện các menu chức năng.
    /// </summary>
    public IList<string> Roles { get; set; } = new List<string>();

    /// <summary>
    /// Danh sách quyền hạn chi tiết (Permissions).
    /// Ví dụ: ["USER_CREATE", "SALES_VIEW", "INVENTORY_MANAGE"]
    /// Frontend dùng để ẩn/hiện các nút bấm cụ thể trong từng trang.
    /// </summary>
    public IList<string> Permissions { get; set; } = new List<string>();
}
