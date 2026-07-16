using FluentValidation;
using PSP.Application.Modules.Product.Commands;

namespace PSP.Application.Modules.Product.Validators;

/// <summary>
/// VALIDATOR (Bộ kiểm tra dữ liệu đầu vào).
/// Lớp này dùng để validate khi thêm mới dòng sản phẩm (CreateProductCommand).
/// </summary>
public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        // 1. Nhóm sản phẩm: Bắt buộc chọn và phải có định dạng Guid hợp lệ
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Nhóm danh mục sản phẩm không được để trống");

        // 2. Thương hiệu: Bắt buộc chọn
        RuleFor(x => x.BrandId)
            .NotEmpty().WithMessage("Thương hiệu sản phẩm không được để trống");

        // 3. Mã dòng sản phẩm: Không trống, tối đa 50 ký tự
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã dòng sản phẩm không được để trống")
            .MaximumLength(50).WithMessage("Mã dòng sản phẩm tối đa 50 ký tự");

        // 4. Tên dòng sản phẩm: Không trống, tối đa 150 ký tự
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên dòng sản phẩm không được để trống")
            .MaximumLength(150).WithMessage("Tên dòng sản phẩm tối đa 150 ký tự");
    }
}

/// <summary>
/// VALIDATOR (Bộ kiểm tra dữ liệu đầu vào).
/// Lớp này dùng để validate khi cập nhật thông tin dòng sản phẩm (UpdateProductCommand).
/// </summary>
public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator()
    {
        // 1. Id dòng máy: Bắt buộc phải có
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id sản phẩm không hợp lệ");

        // 2. Nhóm sản phẩm: Bắt buộc
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Nhóm danh mục sản phẩm không được để trống");

        // 3. Thương hiệu: Bắt buộc
        RuleFor(x => x.BrandId)
            .NotEmpty().WithMessage("Thương hiệu sản phẩm không được để trống");

        // 4. Tên dòng máy mới: Bắt buộc, tối đa 150 ký tự
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên dòng sản phẩm không được để trống")
            .MaximumLength(150).WithMessage("Tên dòng sản phẩm tối đa 150 ký tự");
    }
}
