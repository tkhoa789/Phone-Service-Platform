using Mapster;
using MediatR;
using PSP.Application.Common.Interfaces;
using PSP.Application.Modules.Auth.Commands;
using PSP.Application.Modules.Auth.DTOs;
using PSP.Domain.Common.Exceptions;
using PSP.Domain.Modules.Auth.Entities;
using PSP.Domain.Modules.Branch.Entities;

namespace PSP.Application.Modules.Auth.Handlers;

/// <summary>
/// =====================================================================
/// BỘ XỬ LÝ LÀM MỚI TOKEN (RefreshTokenCommandHandler)
/// =====================================================================
/// 
/// KỊCH BẢN: Access Token hết hạn → Client gửi Refresh Token lên đây
/// để xin cặp Token mới mà không cần nhập lại mật khẩu.
///
/// BẢO MẬT - TOKEN ROTATION:
/// --------------------------
/// Mỗi lần làm mới:
///   1. Thu hồi Refresh Token CŨ.
///   2. Cấp Refresh Token MỚI.
/// → Nếu hacker lỡ đánh cắp Refresh Token cũ, nó đã vô hiệu hóa rồi.
/// → Đây là kỹ thuật bảo mật tiêu chuẩn trong hệ thống Enterprise.
/// =====================================================================
/// </summary>
public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtProvider _jwtProvider;
    private readonly IAuthService _authService;

    public RefreshTokenCommandHandler(
        IUnitOfWork unitOfWork,
        IJwtProvider jwtProvider,
        IAuthService authService)
    {
        _unitOfWork = unitOfWork;
        _jwtProvider = jwtProvider;
        _authService = authService;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // ===== BƯỚC 1: KIỂM TRA REFRESH TOKEN CÓ HỢP LỆ KHÔNG =====
        var (userId, isValid) = await _authService.ValidateRefreshTokenAsync(
            request.RefreshToken, cancellationToken
        );

        if (!isValid)
        {
            throw new UnauthorizedException("Refresh Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }

        // ===== BƯỚC 2: TÌM USER TRONG DATABASE =====
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var user = await userRepo.GetByIdAsNoTrackingAsync(userId, cancellationToken);

        if (user == null || user.Status != PSP.Domain.Common.Enums.UserStatus.Active)
        {
            // User đã bị xóa hoặc bị khóa sau khi đăng nhập → Thu hồi hết và báo lỗi.
            await _authService.RevokeAllUserRefreshTokensAsync(userId, cancellationToken);
            throw new UnauthorizedException("Tài khoản không còn hoạt động. Vui lòng liên hệ quản trị viên.");
        }

        // ===== BƯỚC 3: LẤY ROLE & PERMISSION (có thể đã thay đổi kể từ lần login trước) =====
        var roles = await _authService.GetUserRolesAsync(userId, cancellationToken);
        var permissions = await _authService.GetUserPermissionsAsync(userId, cancellationToken);

        // ===== BƯỚC 4: TOKEN ROTATION - Thu hồi cũ, cấp mới =====
        // 4a. Thu hồi Refresh Token cũ
        await _authService.RevokeRefreshTokenAsync(request.RefreshToken, cancellationToken);

        // 4b. Sinh cặp Token mới
        var newAccessToken = _jwtProvider.GenerateToken(user, roles, permissions);
        var newRefreshToken = _jwtProvider.GenerateRefreshToken();

        // 4c. Lưu Refresh Token mới vào Database
        var newExpiry = DateTime.UtcNow.AddDays(7);
        await _authService.SaveRefreshTokenAsync(userId, newRefreshToken, newExpiry, cancellationToken);

        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var branch = await branchRepo.GetByIdAsNoTrackingAsync(user.BranchId, cancellationToken);
        var userDto = user.Adapt<UserDto>() with
        {
            BranchName = branch?.Name ?? string.Empty,
            BranchAddress = branch?.Address ?? string.Empty,
            BranchPhone = branch?.Phone ?? string.Empty
        };

        // ===== BƯỚC 5: TRẢ KẾT QUẢ =====
        return new AuthResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            TokenType = "Bearer",
            ExpiresIn = 3600,
            User = userDto,
            Roles = roles,
            Permissions = permissions
        };
    }
}
