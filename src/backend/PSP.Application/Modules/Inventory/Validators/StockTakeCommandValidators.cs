using FluentValidation;
using PSP.Application.Modules.Inventory.Commands;

namespace PSP.Application.Modules.Inventory.Validators;

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho CreateStockTakeCommand.
/// </summary>
public class CreateStockTakeCommandValidator : AbstractValidator<CreateStockTakeCommand>
{
    public CreateStockTakeCommandValidator()
    {
        RuleFor(x => x.WarehouseId)
            .NotEmpty().WithMessage("ID Kho hàng không được để trống.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã phiếu kiểm kê không được để trống.")
            .MaximumLength(50).WithMessage("Mã phiếu kiểm kê không vượt quá 50 ký tự.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Danh sách sản phẩm kiểm kê không được để trống.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductVariantId)
                .NotEmpty().WithMessage("ID Biến thể sản phẩm không được để trống.");

            item.RuleFor(i => i.ActualQuantity)
                .GreaterThanOrEqualTo(0).WithMessage("Số lượng thực tế kiểm đếm không được âm.");
        });
    }
}

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho UpdateStockTakeCommand.
/// </summary>
public class UpdateStockTakeCommandValidator : AbstractValidator<UpdateStockTakeCommand>
{
    public UpdateStockTakeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID Phiếu kiểm kê không được để trống.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Danh sách sản phẩm kiểm kê không được để trống.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductVariantId)
                .NotEmpty().WithMessage("ID Biến thể sản phẩm không được để trống.");

            item.RuleFor(i => i.ActualQuantity)
                .GreaterThanOrEqualTo(0).WithMessage("Số lượng thực tế kiểm đếm không được âm.");
        });
    }
}

/// <summary>
/// Trình kiểm tra (Validator) cho CompleteStockTakeCommand.
/// </summary>
public class CompleteStockTakeCommandValidator : AbstractValidator<CompleteStockTakeCommand>
{
    public CompleteStockTakeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID Phiếu kiểm kê không được để trống.");
    }
}
