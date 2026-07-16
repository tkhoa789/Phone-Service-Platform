using FluentValidation;
using PSP.Application.Modules.Product.Commands;

namespace PSP.Application.Modules.Product.Validators;

/// <summary>
/// VALIDATOR (Bộ kiểm tra dữ liệu đầu vào).
/// Lớp này dùng để validate khi tạo mới biến thể sản phẩm (CreateProductVariantCommand).
/// </summary>
public class CreateProductVariantCommandValidator : AbstractValidator<CreateProductVariantCommand>
{
    public CreateProductVariantCommandValidator()
    {
        // 1. Id của dòng máy cha bắt buộc phải có
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Dòng sản phẩm cha không được để trống");

        // 2. Mã SKU: Bắt buộc, tối đa 50 ký tự
        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("Mã SKU không được để trống")
            .MaximumLength(50).WithMessage("Mã SKU tối đa 50 ký tự");

        // 3. Tên biến thể sản phẩm: Bắt buộc, tối đa 255 ký tự
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên biến thể sản phẩm không được để trống")
            .MaximumLength(255).WithMessage("Tên biến thể sản phẩm tối đa 255 ký tự");

        // 4. Màu sắc: Tối đa 50 ký tự
        RuleFor(x => x.Color)
            .MaximumLength(50).WithMessage("Màu sắc sản phẩm tối đa 50 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Color));

        // 5. Dung lượng bộ nhớ: Tối đa 30 ký tự
        RuleFor(x => x.Capacity)
            .MaximumLength(30).WithMessage("Dung lượng bộ nhớ tối đa 30 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Capacity));

        // 6. Giá nhập kho gốc: Phải lớn hơn hoặc bằng 0
        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Giá nhập kho gốc không được là số âm");

        // 7. Giá bán lẻ niêm yết: Phải lớn hơn hoặc bằng 0
        RuleFor(x => x.SalePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Giá bán lẻ niêm yết không được là số âm");
    }
}

/// <summary>
/// VALIDATOR (Bộ kiểm tra dữ liệu đầu vào).
/// Lớp này dùng để validate khi cập nhật thông tin biến thể sản phẩm (UpdateProductVariantCommand).
/// </summary>
public class UpdateProductVariantCommandValidator : AbstractValidator<UpdateProductVariantCommand>
{
    public UpdateProductVariantCommandValidator()
    {
        // 1. Id biến thể sản phẩm: Bắt buộc phải có
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id biến thể sản phẩm không hợp lệ");

        // 2. Tên biến thể sản phẩm mới: Bắt buộc, tối đa 255 ký tự
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên biến thể sản phẩm không được để trống")
            .MaximumLength(255).WithMessage("Tên biến thể sản phẩm tối đa 255 ký tự");

        // 3. Màu sắc: Tối đa 50 ký tự
        RuleFor(x => x.Color)
            .MaximumLength(50).WithMessage("Màu sắc sản phẩm tối đa 50 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Color));

        // 4. Dung lượng bộ nhớ: Tối đa 30 ký tự
        RuleFor(x => x.Capacity)
            .MaximumLength(30).WithMessage("Dung lượng bộ nhớ tối đa 30 ký tự")
            .When(x => !string.IsNullOrEmpty(x.Capacity));

        // 5. Giá nhập kho gốc mới: Phải lớn hơn hoặc bằng 0
        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("Giá nhập kho gốc không được là số âm");

        // 6. Giá bán lẻ niêm yết mới: Phải lớn hơn hoặc bằng 0
        RuleFor(x => x.SalePrice)
            .GreaterThanOrEqualTo(0).WithMessage("Giá bán lẻ niêm yết không được là số âm");
    }
}
