using FluentValidation;
using PSP.Application.Modules.Branch.Commands;

namespace PSP.Application.Modules.Branch.Validators;

/// <summary>
/// Nơi định nghĩa các luật lệ (Quy tắc) phải tuân thủ trước khi cho phép dữ liệu lọt vào hệ thống.
/// Giống như "Bảo vệ cửa" - ai điền form sai quy định sẽ bị đuổi về ngay lập tức, không cho vào trong làm phiền "Nhà bếp" (Handler).
/// Thư viện "FluentValidation" giúp chúng ta viết code bằng tiếng Anh đọc như một câu hội thoại bình thường.
/// </summary>
public class CreateBranchCommandValidator : AbstractValidator<CreateBranchCommand>
{
    // Hàm khởi tạo, đây là nơi cài đặt hệ thống cảm biến bắt lỗi.
    public CreateBranchCommandValidator()
    {
        // Luật 1: Đối với ô điền "Code" (Mã chi nhánh).
        // - NotEmpty: Không được bỏ trống. Nếu bỏ trống thì chửi: "Mã chi nhánh không được để trống".
        // - MaximumLength(50): Độ dài không quá 50 chữ. Nếu quá thì chửi: "Mã tối đa 50 ký tự".
        RuleFor(x => x.Code).NotEmpty().WithMessage("Mã chi nhánh không được để trống")
                            .MaximumLength(50).WithMessage("Mã chi nhánh tối đa 50 ký tự");
                            
        // Luật 2: Đối với ô điền "Name" (Tên). Tương tự như trên.
        RuleFor(x => x.Name).NotEmpty().WithMessage("Tên chi nhánh không được để trống")
                            .MaximumLength(200).WithMessage("Tên chi nhánh tối đa 200 ký tự");
                            
        // Luật 3: Địa chỉ không được bỏ trống.
        RuleFor(x => x.Address).NotEmpty().WithMessage("Địa chỉ không được để trống");
        
        // Luật 4: Số điện thoại.
        // - Matches(@"^\d{10,11}$"): Đây là biểu thức chính quy (Regex). 
        // Dịch ra nghĩa là: Chỉ được phép nhập số (\d), độ dài từ 10 đến 11 chữ số. Khớp thì mới cho qua.
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Số điện thoại không được để trống")
                             .Matches(@"^\d{10,11}$").WithMessage("Số điện thoại không đúng định dạng");
                             
        // Luật 5: Email.
        // - Cụm When(...): Tức là NẾU người ta có nhập email (chứ không bỏ trống) THÌ mới xét luật bên trái.
        // - EmailAddress(): Hàm có sẵn kiểm tra xem có chứa chữ @ và đuôi .com hay không.
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email không đúng định dạng");
    }
}

/// <summary>
/// Bảo vệ cửa dành riêng cho luồng SỬA (Update).
/// Cũng có luật tương tự như luồng tạo mới, nhưng bắt thêm lỗi nếu sửa mà không nói rõ sửa thằng nào (Thiếu Id).
/// </summary>
public class UpdateBranchCommandValidator : AbstractValidator<UpdateBranchCommand>
{
    public UpdateBranchCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id chi nhánh không hợp lệ");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Tên chi nhánh không được để trống")
                            .MaximumLength(200).WithMessage("Tên chi nhánh tối đa 200 ký tự");
        RuleFor(x => x.Address).NotEmpty().WithMessage("Địa chỉ không được để trống");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Số điện thoại không được để trống")
                             .Matches(@"^\d{10,11}$").WithMessage("Số điện thoại không đúng định dạng");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email không đúng định dạng");
    }
}
