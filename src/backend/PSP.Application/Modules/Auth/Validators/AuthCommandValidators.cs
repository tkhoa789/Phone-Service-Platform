using FluentValidation;
using PSP.Application.Modules.Auth.Commands;

namespace PSP.Application.Modules.Auth.Validators;

/// <summary>
/// =====================================================================
/// CHỐT CHẶN AN NINH CHO ĐĂNG NHẬP (LoginCommandValidator)
/// =====================================================================
/// 
/// Kiểm tra dữ liệu TRƯỚC KHI gửi xuống Handler.
/// Nếu thiếu username hoặc password → Chặn ngay, không cho phép tiếp tục.
///
/// Lưu ý: Ở đây ta CHỈ kiểm tra "có nhập hay không" (format check).
/// Việc kiểm tra "đúng hay sai" (logic check) là nhiệm vụ của Handler.
/// =====================================================================
/// </summary>
public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");
    }
}

/// <summary>
/// Kiểm tra dữ liệu cho Đăng xuất.
/// </summary>
public class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh Token không được để trống.");
    }
}

/// <summary>
/// Kiểm tra dữ liệu cho Làm mới Token.
/// </summary>
public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh Token không được để trống.");
    }
}
