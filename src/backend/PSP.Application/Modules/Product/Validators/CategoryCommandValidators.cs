using FluentValidation;
using PSP.Application.Modules.Product.Commands;

namespace PSP.Application.Modules.Product.Validators;

/// <summary>
/// VALIDATOR (Bộ kiểm tra tính hợp lệ của dữ liệu đầu vào)
/// Lớp này kiểm tra dữ liệu gửi lên khi tạo mới Danh mục (CreateCategoryCommand).
/// </summary>
public class CreateCategoryCommandValidator : AbstractValidator<CreateCategoryCommand>
{
    /// <summary>
    /// Hàm khởi tạo thiết lập các quy tắc validate cho danh mục.
    /// </summary>
    public CreateCategoryCommandValidator()
    {
        // Mã danh mục bắt buộc nhập và không dài quá 30 ký tự
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã danh mục không được để trống")
            .MaximumLength(30).WithMessage("Mã danh mục tối đa 30 ký tự");

        // Tên danh mục bắt buộc nhập và không dài quá 100 ký tự
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên danh mục không được để trống")
            .MaximumLength(100).WithMessage("Tên danh mục tối đa 100 ký tự");
    }
}

/// <summary>
/// VALIDATOR (Bộ kiểm tra tính hợp lệ của dữ liệu đầu vào)
/// Lớp này kiểm tra dữ liệu gửi lên khi cập nhật Danh mục (UpdateCategoryCommand).
/// </summary>
public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    /// <summary>
    /// Hàm khởi tạo thiết lập các quy tắc cập nhật danh mục.
    /// </summary>
    public UpdateCategoryCommandValidator()
    {
        // Id của danh mục cần cập nhật bắt buộc phải có giá trị
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id danh mục không hợp lệ");

        // Tên danh mục mới bắt buộc nhập và không dài quá 100 ký tự
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên danh mục không được để trống")
            .MaximumLength(100).WithMessage("Tên danh mục tối đa 100 ký tự");
    }
}

