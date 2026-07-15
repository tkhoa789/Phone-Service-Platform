using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSP.Application.Common.Models;
using PSP.Application.Modules.Auth.Commands;
using PSP.Application.Modules.Auth.DTOs;

namespace PSP.API.Controllers;

/// <summary>
/// =====================================================================
/// CONTROLLER XÁC THỰC (AuthController)
/// =====================================================================
/// 
/// "Cổng vào chính" cho mọi thao tác liên quan đến Đăng nhập / Đăng xuất.
/// 
/// Gồm 3 API:
///   POST /api/Auth/login         → Đăng nhập, nhận JWT Token.
///   POST /api/Auth/refresh-token → Làm mới Token khi hết hạn.
///   POST /api/Auth/logout        → Đăng xuất, thu hồi Refresh Token.
///
/// [AllowAnonymous] = Cho phép gọi mà KHÔNG cần Token.
///   → Hiển nhiên, API đăng nhập phải cho phép gọi mà không cần đăng nhập trước!
///
/// [Authorize] = BẮT BUỘC phải có Token hợp lệ mới được gọi.
///   → API đăng xuất yêu cầu phải đang đăng nhập thì mới được đăng xuất.
/// =====================================================================
/// </summary>
[Route("api/[controller]")]
[Tags("Authorization")]
public class AuthController : BaseApiController
{
    /// <summary>
    /// =====================================================================
    /// API ĐĂNG NHẬP
    /// =====================================================================
    /// 
    /// Endpoint: POST /api/Auth/login
    /// Body:     { "username": "admin", "password": "Admin@123" }
    /// 
    /// Kết quả thành công (200 OK):
    /// {
    ///   "code": "SUCCESS",
    ///   "data": {
    ///     "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    ///     "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    ///     "tokenType": "Bearer",
    ///     "expiresIn": 3600,
    ///     "user": { "id": "...", "fullName": "Admin" },
    ///     "roles": ["Admin"],
    ///     "permissions": ["USER_CREATE", "SALES_VIEW"]
    ///   }
    /// }
    /// =====================================================================
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(
        [FromBody] LoginCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.Success(result, "Đăng nhập thành công"));
    }

    /// <summary>
    /// =====================================================================
    /// API LÀM MỚI TOKEN
    /// =====================================================================
    /// 
    /// Endpoint: POST /api/Auth/refresh-token
    /// Body:     { "refreshToken": "dGhpcyBpcyBhIHJlZnJl..." }
    /// 
    /// Khi AccessToken hết hạn (sau 60 phút), Frontend tự động gọi API này 
    /// để xin cặp Token mới mà KHÔNG cần nhập lại mật khẩu.
    /// =====================================================================
    /// </summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RefreshToken(
        [FromBody] RefreshTokenCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<AuthResponseDto>.Success(result, "Làm mới Token thành công"));
    }

    /// <summary>
    /// =====================================================================
    /// API ĐĂNG XUẤT
    /// =====================================================================
    /// 
    /// Endpoint: POST /api/Auth/logout
    /// Body:     { "refreshToken": "dGhpcyBpcyBhIHJlZnJl..." }
    /// Header:   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    /// 
    /// Thu hồi Refresh Token → Kẻ xấu không thể xin cấp Token mới nữa.
    /// =====================================================================
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(
        [FromBody] LogoutCommand command,
        CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<bool>.Success(result, "Đăng xuất thành công"));
    }
}
