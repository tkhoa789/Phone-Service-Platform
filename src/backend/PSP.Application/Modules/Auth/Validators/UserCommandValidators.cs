using FluentValidation;
using PSP.Application.Modules.Auth.Commands;

namespace PSP.Application.Modules.Auth.Validators;

/// <summary>
/// Chốt chặn an ninh trước khi tạo User mới. 
/// Ai điền thiếu 1 trường thì lập tức bị chặn ngay vòng gửi xe (Controller), không lọt được xuống Nhà bếp (Handler).
/// </summary>
public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        // 1. Phải chọn chi nhánh (không được truyền chuỗi rỗng)
        RuleFor(x => x.BranchId).NotEmpty().WithMessage("Vui lòng chọn chi nhánh làm việc");
        
        // 2. Tên tài khoản không được rỗng và bắt buộc tối thiểu 3 chữ cái.
        RuleFor(x => x.Username).NotEmpty().WithMessage("Tên đăng nhập không được để trống")
                                .MinimumLength(3).WithMessage("Tên đăng nhập phải từ 3 ký tự trở lên");
                                
        // 3. Mật khẩu cũng bắt buộc, và để đảm bảo tính an toàn thì ít nhất phải 6 chữ.
        RuleFor(x => x.Password).NotEmpty().WithMessage("Mật khẩu không được để trống")
                                .MinimumLength(6).WithMessage("Mật khẩu phải từ 6 ký tự trở lên");
                                
        // 4. Các thông tin cá nhân.
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Họ tên không được để trống");
        
        // 5. Số điện thoại chỉ được dùng số (\d là chữ số), độ dài từ 10 đến 11.
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Số điện thoại không được để trống")
                             .Matches(@"^\d{10,11}$").WithMessage("Số điện thoại không hợp lệ");
                             
        // 6. Kiểm tra cấu trúc Email (có @, có dấu .) NẾU như người dùng có nhập.
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email không hợp lệ");
    }
}

/// <summary>
/// Chốt chặn an ninh cho luồng SỬA (Update).
/// </summary>
public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        // Khác biệt duy nhất: Phải truyền ID của đứa cần sửa lên. (Sửa mà chả nói sửa ai thì máy tính sao hiểu).
        RuleFor(x => x.Id).NotEmpty().WithMessage("ID người dùng không hợp lệ");
        
        RuleFor(x => x.BranchId).NotEmpty().WithMessage("Vui lòng chọn chi nhánh làm việc");
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Họ tên không được để trống");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Số điện thoại không được để trống");
    }
}
