using FluentValidation;
using PSP.Application.Modules.Inventory.Commands;

namespace PSP.Application.Modules.Inventory.Validators;

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho CreatePurchaseOrderCommand.
/// </summary>
public class CreatePurchaseOrderCommandValidator : AbstractValidator<CreatePurchaseOrderCommand>
{
    public CreatePurchaseOrderCommandValidator()
    {
        RuleFor(x => x.SupplierId)
            .NotEmpty().WithMessage("ID Nhà cung cấp không được để trống.");

        RuleFor(x => x.WarehouseId)
            .NotEmpty().WithMessage("ID Kho hàng không được để trống.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã phiếu nhập kho không được để trống.")
            .MaximumLength(50).WithMessage("Mã phiếu nhập kho không được vượt quá 50 ký tự.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Danh sách mặt hàng nhập kho không được để trống.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductVariantId)
                .NotEmpty().WithMessage("ID Biến thể sản phẩm không được để trống.");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Số lượng nhập kho phải lớn hơn 0.");

            item.RuleFor(i => i.UnitPrice)
                .GreaterThanOrEqualTo(0).WithMessage("Đơn giá nhập không được âm.");
        });
    }
}

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho UpdatePurchaseOrderCommand.
/// </summary>
public class UpdatePurchaseOrderCommandValidator : AbstractValidator<UpdatePurchaseOrderCommand>
{
    public UpdatePurchaseOrderCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID Phiếu nhập kho không được để trống.");

        RuleFor(x => x.SupplierId)
            .NotEmpty().WithMessage("ID Nhà cung cấp không được để trống.");

        RuleFor(x => x.WarehouseId)
            .NotEmpty().WithMessage("ID Kho hàng không được để trống.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Danh sách mặt hàng nhập kho không được để trống.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductVariantId)
                .NotEmpty().WithMessage("ID Biến thể sản phẩm không được để trống.");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Số lượng nhập kho phải lớn hơn 0.");

            item.RuleFor(i => i.UnitPrice)
                .GreaterThanOrEqualTo(0).WithMessage("Đơn giá nhập không được âm.");
        });
    }
}

/// <summary>
/// Trình kiểm tra (Validator) cho CompletePurchaseOrderCommand.
/// </summary>
public class CompletePurchaseOrderCommandValidator : AbstractValidator<CompletePurchaseOrderCommand>
{
    public CompletePurchaseOrderCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID Phiếu nhập kho không được để trống.");
    }
}
