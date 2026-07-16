using FluentValidation;
using PSP.Application.Modules.Product.Commands;

namespace PSP.Application.Modules.Product.Validators;

/// <summary>
/// VALIDATOR (Bộ kiểm tra tính hợp lệ dữ liệu đầu vào).
/// Lớp này dùng để validate các thuộc tính gửi lên khi Tạo mới Nhà cung cấp (CreateSupplierCommand).
/// 
/// Giải thích cho người mới bắt đầu:
/// - Kế thừa từ "AbstractValidator<CreateSupplierCommand>" của thư viện FluentValidation.
/// - Trong hàm khởi tạo, ta sử dụng cú pháp "RuleFor(x => x.Property)" để chỉ định quy tắc kiểm tra cho từng thuộc tính.
/// - Điều này giúp tách biệt hoàn toàn code kiểm tra dữ liệu ra khỏi Controller và Handler, giúp code sạch và dễ viết Unit Test hơn.
/// </summary>
public class CreateSupplierCommandValidator : AbstractValidator<CreateSupplierCommand>
{
    /// <summary>
    /// Hàm khởi tạo chứa các luật kiểm tra (Rules) cho hành động Tạo mới.
    /// </summary>
    public CreateSupplierCommandValidator()
    {
        // 1. Luật cho thuộc tính Code (Mã nhà cung cấp)
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã nhà cung cấp không được để trống") // Không được null hoặc rỗng
            .MaximumLength(30).WithMessage("Mã nhà cung cấp tối đa 30 ký tự"); // Chiều dài chuỗi tối đa 30 ký tự (khớp cấu hình DB)

        // 2. Luật cho thuộc tính Name (Tên nhà cung cấp)
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên nhà cung cấp không được để trống")
            .MaximumLength(150).WithMessage("Tên nhà cung cấp tối đa 150 ký tự");

        // 3. Luật cho thuộc tính Phone (Số điện thoại)
        RuleFor(x => x.Phone)
            .MaximumLength(15).WithMessage("Số điện thoại tối đa 15 ký tự")
            // Sử dụng Regular Expression (Matches) để đảm bảo số điện thoại chỉ chứa chữ số, khoảng trắng hoặc dấu +, -
            .Matches(@"^[0-9+\-\s]*$").WithMessage("Số điện thoại không hợp lệ")
            // Luật này CHỈ kích hoạt khi người dùng thực sự có nhập SĐT (không để trống)
            .When(x => !string.IsNullOrEmpty(x.Phone));

        // 4. Luật cho thuộc tính Email
        RuleFor(x => x.Email)
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự")
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng") // Tự động kiểm tra cú pháp email hợp lệ
            .When(x => !string.IsNullOrEmpty(x.Email));

        // 5. Luật cho thuộc tính Address (Địa chỉ)
        RuleFor(x => x.Address)
            .MaximumLength(255).WithMessage("Địa chỉ tối đa 255 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Address));
    }
}

/// <summary>
/// VALIDATOR (Bộ kiểm tra tính hợp lệ dữ liệu đầu vào).
/// Lớp này dùng để validate các thuộc tính gửi lên khi Cập nhật thông tin Nhà cung cấp (UpdateSupplierCommand).
/// </summary>
public class UpdateSupplierCommandValidator : AbstractValidator<UpdateSupplierCommand>
{
    /// <summary>
    /// Hàm khởi tạo chứa các luật kiểm tra cho hành động Cập nhật.
    /// </summary>
    public UpdateSupplierCommandValidator()
    {
        // 1. Id của nhà cung cấp cần sửa bắt buộc phải có giá trị Guid hợp lệ (không được để trống/mặc định)
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id nhà cung cấp không hợp lệ");

        // 2. Tên nhà cung cấp mới không được để trống
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên nhà cung cấp không được để trống")
            .MaximumLength(150).WithMessage("Tên nhà cung cấp tối đa 150 ký tự");

        // 3. Kiểm tra số điện thoại nếu có cập nhật mới
        RuleFor(x => x.Phone)
            .MaximumLength(15).WithMessage("Số điện thoại tối đa 15 ký tự")
            .Matches(@"^[0-9+\-\s]*$").WithMessage("Số điện thoại không hợp lệ")
            .When(x => !string.IsNullOrEmpty(x.Phone));

        // 4. Kiểm tra Email mới nếu có nhập
        RuleFor(x => x.Email)
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự")
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng")
            .When(x => !string.IsNullOrEmpty(x.Email));

        // 5. Kiểm tra địa chỉ mới nếu có nhập
        RuleFor(x => x.Address)
            .MaximumLength(255).WithMessage("Địa chỉ tối đa 255 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Address));
    }
}

