using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Auth.Commands;

namespace PSP.Application.Modules.Auth.Handlers;

/// <summary>
/// =====================================================================
/// BỘ XỬ LÝ ĐĂNG XUẤT (LogoutCommandHandler)
/// =====================================================================
/// 
/// LUỒNG XỬ LÝ:
/// 1. Nhận Refresh Token từ Client.
/// 2. Thu hồi (revoke) token đó trong Database.
/// 3. Trả về true (thành công).
///
/// LƯU Ý: Access Token (JWT) là stateless, server KHÔNG THỂ hủy nó.
/// Nhưng nó sẽ tự hết hạn sau 60 phút.
/// Bằng cách thu hồi Refresh Token, ta đảm bảo kẻ xấu không thể
/// xin cấp Access Token mới sau khi User đã đăng xuất.
/// =====================================================================
/// </summary>
public class LogoutCommandHandler : IRequestHandler<LogoutCommand, bool>
{
    private readonly IAuthService _authService;

    public LogoutCommandHandler(IAuthService authService)
    {
        _authService = authService;
    }

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        // Thu hồi Refresh Token → Đánh dấu Revoked = true trong Database.
        await _authService.RevokeRefreshTokenAsync(request.RefreshToken, cancellationToken);
        return true;
    }
}
