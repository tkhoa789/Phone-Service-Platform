using FluentValidation;
using PSP.Application.Modules.Product.Commands;

namespace PSP.Application.Modules.Product.Validators;

/// <summary>
/// VALIDATOR (Bộ kiểm tra tính hợp lệ của dữ liệu đầu vào)
/// Lớp này kiểm tra dữ liệu gửi lên khi tạo mới Thương hiệu (CreateBrandCommand).
/// FluentValidation giúp tách biệt logic kiểm tra dữ liệu ra khỏi Controller và Business Handler.
/// </summary>
public class CreateBrandCommandValidator : AbstractValidator<CreateBrandCommand>
{
    /// <summary>
    /// Hàm khởi tạo thiết lập các quy tắc (Rules) validate.
    /// </summary>
    public CreateBrandCommandValidator()
    {
        // Kiểm tra mã thương hiệu
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã thương hiệu không được để trống")
            .MaximumLength(30).WithMessage("Mã thương hiệu tối đa 30 ký tự");

        // Kiểm tra tên thương hiệu
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên thương hiệu không được để trống")
            .MaximumLength(100).WithMessage("Tên thương hiệu tối đa 100 ký tự");
    }
}

/// <summary>
/// VALIDATOR (Bộ kiểm tra tính hợp lệ của dữ liệu đầu vào)
/// Lớp này kiểm tra dữ liệu gửi lên khi cập nhật Thương hiệu (UpdateBrandCommand).
/// </summary>
public class UpdateBrandCommandValidator : AbstractValidator<UpdateBrandCommand>
{
    /// <summary>
    /// Hàm khởi tạo thiết lập các quy tắc (Rules) validate.
    /// </summary>
    public UpdateBrandCommandValidator()
    {
        // Id của thương hiệu cần sửa không được trống
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id thương hiệu không hợp lệ");

        // Tên mới của thương hiệu không được trống và tối đa 100 ký tự
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên thương hiệu không được để trống")
            .MaximumLength(100).WithMessage("Tên thương hiệu tối đa 100 ký tự");
    }
}

