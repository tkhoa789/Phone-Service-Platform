using FluentValidation;
using PSP.Application.Modules.Inventory.Commands;
using PSP.Domain.Common.Enums;
using System;

namespace PSP.Application.Modules.Inventory.Validators;

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho UpdateInventoryMinStockCommand.
/// </summary>
public class UpdateInventoryMinStockCommandValidator : AbstractValidator<UpdateInventoryMinStockCommand>
{
    public UpdateInventoryMinStockCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID dòng tồn kho không được để trống.");

        RuleFor(x => x.MinimumStock)
            .GreaterThanOrEqualTo(0).WithMessage("Định mức tồn tối thiểu không được âm.");
    }
}

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu cho UpdateImeiStatusCommand.
/// </summary>
public class UpdateImeiStatusCommandValidator : AbstractValidator<UpdateImeiStatusCommand>
{
    public UpdateImeiStatusCommandValidator()
    {
        RuleFor(x => x.Imei)
            .NotEmpty().WithMessage("Mã IMEI không được để trống.")
            .MaximumLength(50).WithMessage("Mã IMEI không vượt quá 50 ký tự.");

        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái IMEI không được để trống.")
            .Must(status => Enum.TryParse<ImeiStatus>(status, true, out _))
            .WithMessage("Trạng thái IMEI không hợp lệ. Các giá trị được chấp nhận: InStock, Sold, Repairing, WarrantyHold, Disposed, WrittenOff.");
    }
}
