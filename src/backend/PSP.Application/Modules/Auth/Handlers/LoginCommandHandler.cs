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
/// BỘ XỬ LÝ ĐĂNG NHẬP (LoginCommandHandler)
/// =====================================================================
/// 
/// Đây là "Bộ não" xử lý toàn bộ logic khi ai đó bấm nút "Đăng nhập".
///
/// LUỒNG XỬ LÝ TUẦN TỰ (7 bước):
/// --------------------------------
/// 1. Tìm User theo Username trong Database.
/// 2. Kiểm tra tài khoản có bị khóa không.
/// 3. So sánh mật khẩu (đã được băm BCrypt).
/// 4. Lấy danh sách Role và Permission của User.
/// 5. Sinh ra Access Token (JWT) và Refresh Token.
/// 6. Lưu Refresh Token vào Database.
/// 7. Ghi log đăng nhập và trả kết quả về Client.
///
/// BẢO MẬT:
/// ---------
/// - Không bao giờ tiết lộ "Username sai" hay "Mật khẩu sai" riêng lẻ.
///   → Luôn trả về chung chung: "Tên đăng nhập hoặc mật khẩu không chính xác."
///   → Để hacker không biết được username nào tồn tại trong hệ thống.
/// =====================================================================
/// </summary>
public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    // ===== CÁC "DỤNG CỤ" CẦN THIẾT =====
    
    /// <summary> "Tủ hồ sơ" chung - dùng để tìm kiếm User trong Database. </summary>
    private readonly IUnitOfWork _unitOfWork;

    /// <summary> "Máy kiểm tra mật khẩu" - so sánh mật khẩu người nhập với bản băm trong DB. </summary>
    private readonly IPasswordHasher _passwordHasher;

    /// <summary> "Máy in thẻ" - sinh ra JWT Token và Refresh Token. </summary>
    private readonly IJwtProvider _jwtProvider;

    /// <summary> "Bộ phận nhân sự Auth" - lấy Role, Permission, lưu RefreshToken, ghi log. </summary>
    private readonly IAuthService _authService;

    /// <summary>
    /// Constructor: Hệ thống DI tự động tiêm tất cả "dụng cụ" vào đây.
    /// </summary>
    public LoginCommandHandler(
        IUnitOfWork unitOfWork,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        IAuthService authService)
    {
        _unitOfWork = unitOfWork;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
        _authService = authService;
    }

    /// <summary>
    /// Hàm chính: Nhận lệnh LoginCommand, xử lý và trả về AuthResponseDto.
    /// </summary>
    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // ===== BƯỚC 1: TÌM USER THEO USERNAME =====
        // Mở "Tủ hồ sơ" UserEntity, tìm nhân viên có tên đăng nhập trùng khớp.
        var userRepo = _unitOfWork.Repository<UserEntity>();
        var users = await userRepo.FindAsync(
            x => x.Username == request.Username,
            cancellationToken
        );
        var user = users.FirstOrDefault();

        // Nếu không tìm thấy → Báo lỗi chung (không tiết lộ cụ thể là sai username).
        if (user == null)
        {
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        // ===== BƯỚC 2: KIỂM TRA TÀI KHOẢN CÓ BỊ KHÓA KHÔNG =====
        if (user.Status != PSP.Domain.Common.Enums.UserStatus.Active)
        {
            // Ghi log đăng nhập thất bại (để audit biết có ai đang cố đăng nhập tài khoản bị khóa).
            await _authService.LogLoginAttemptAsync(user.Id, null, null, false, cancellationToken);
            throw new UnauthorizedException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        // ===== BƯỚC 3: SO SÁNH MẬT KHẨU =====
        // Lấy mật khẩu người dùng vừa nhập (dạng chữ thường)
        // và so sánh với bản băm BCrypt đã lưu trong Database.
        // BCrypt tự động xử lý việc băm + so sánh an toàn.
        var isPasswordValid = _passwordHasher.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            // Ghi log thất bại
            await _authService.LogLoginAttemptAsync(user.Id, null, null, false, cancellationToken);
            throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        // ===== BƯỚC 4: LẤY DANH SÁCH ROLE & PERMISSION =====
        // Truy vấn phức tạp qua nhiều bảng nối → Giao cho AuthService chuyên trách.
        var roles = await _authService.GetUserRolesAsync(user.Id, cancellationToken);
        var permissions = await _authService.GetUserPermissionsAsync(user.Id, cancellationToken);

        // ===== BƯỚC 5: SINH TOKEN =====
        // 5a. Sinh Access Token (JWT) - chứa thông tin User, Role, Permission bên trong.
        //     Token này có thời hạn ngắn (mặc định 60 phút).
        var accessToken = _jwtProvider.GenerateToken(user, roles, permissions);

        // 5b. Sinh Refresh Token - một chuỗi ngẫu nhiên dài, không chứa thông tin gì.
        //     Token này có thời hạn dài hơn (7 ngày).
        var refreshToken = _jwtProvider.GenerateRefreshToken();

        // ===== BƯỚC 6: LƯU REFRESH TOKEN VÀO DATABASE =====
        // Lưu vào bảng RefreshTokens để sau này kiểm tra khi Client xin cấp lại.
        var refreshExpiry = DateTime.UtcNow.AddDays(7);
        await _authService.SaveRefreshTokenAsync(user.Id, refreshToken, refreshExpiry, cancellationToken);

        // ===== BƯỚC 7: GHI LOG ĐĂNG NHẬP THÀNH CÔNG & TRẢ KẾT QUẢ =====
        await _authService.LogLoginAttemptAsync(user.Id, null, null, true, cancellationToken);

        var branchRepo = _unitOfWork.Repository<BranchEntity>();
        var branch = await branchRepo.GetByIdAsNoTrackingAsync(user.BranchId, cancellationToken);
        var userDto = user.Adapt<UserDto>() with
        {
            BranchName = branch?.Name ?? string.Empty,
            BranchAddress = branch?.Address ?? string.Empty,
            BranchPhone = branch?.Phone ?? string.Empty,
            Roles = roles.ToList()
        };

        // Đóng gói kết quả vào "Hộp quà" AuthResponseDto để trả về cho Client.
        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            TokenType = "Bearer",
            ExpiresIn = 3600, // 60 phút = 3600 giây
            User = userDto,
            Roles = roles,
            Permissions = permissions
        };
    }
}
