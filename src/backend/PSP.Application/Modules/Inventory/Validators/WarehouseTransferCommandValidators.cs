using FluentValidation;
using PSP.Application.Modules.Inventory.Commands;

namespace PSP.Application.Modules.Inventory.Validators;

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho CreateWarehouseTransferCommand.
/// </summary>
public class CreateWarehouseTransferCommandValidator : AbstractValidator<CreateWarehouseTransferCommand>
{
    public CreateWarehouseTransferCommandValidator()
    {
        RuleFor(x => x.FromWarehouseId)
            .NotEmpty().WithMessage("Kho hàng nguồn không được để trống.");

        RuleFor(x => x.ToWarehouseId)
            .NotEmpty().WithMessage("Kho hàng đích không được để trống.")
            .NotEqual(x => x.FromWarehouseId).WithMessage("Kho hàng đích không được trùng với kho hàng nguồn.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã phiếu điều chuyển không được để trống.")
            .MaximumLength(50).WithMessage("Mã phiếu điều chuyển không vượt quá 50 ký tự.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Danh sách hàng hóa điều chuyển không được để trống.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductVariantId)
                .NotEmpty().WithMessage("ID Biến thể sản phẩm không được để trống.");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Số lượng điều chuyển phải lớn hơn 0.");
        });
    }
}

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho UpdateWarehouseTransferCommand.
/// </summary>
public class UpdateWarehouseTransferCommandValidator : AbstractValidator<UpdateWarehouseTransferCommand>
{
    public UpdateWarehouseTransferCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID Phiếu điều chuyển không được để trống.");

        RuleFor(x => x.FromWarehouseId)
            .NotEmpty().WithMessage("Kho hàng nguồn không được để trống.");

        RuleFor(x => x.ToWarehouseId)
            .NotEmpty().WithMessage("Kho hàng đích không được để trống.")
            .NotEqual(x => x.FromWarehouseId).WithMessage("Kho hàng đích không được trùng với kho hàng nguồn.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Danh sách hàng hóa điều chuyển không được để trống.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductVariantId)
                .NotEmpty().WithMessage("ID Biến thể sản phẩm không được để trống.");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Số lượng điều chuyển phải lớn hơn 0.");
        });
    }
}

/// <summary>
/// Trình kiểm tra (Validator) cho ReceiveWarehouseTransferCommand.
/// </summary>
public class ReceiveWarehouseTransferCommandValidator : AbstractValidator<ReceiveWarehouseTransferCommand>
{
    public ReceiveWarehouseTransferCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID Phiếu điều chuyển không được để trống.");
    }
}
