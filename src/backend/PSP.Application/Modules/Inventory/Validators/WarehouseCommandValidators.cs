using FluentValidation;
using PSP.Application.Modules.Inventory.Commands;

namespace PSP.Application.Modules.Inventory.Validators;

/// <summary>
/// Trình kiểm tra (Validator) dữ liệu đầu vào cho lệnh tạo mới kho hàng (CreateWarehouseCommand).
/// Sử dụng thư viện FluentValidation để cấu hình các luật kiểm tra rõ ràng.
/// </summary>
public class CreateWarehouseCommandValidator : AbstractValidator<CreateWarehouseCommand>
{
    public CreateWarehouseCommandValidator()
    {
        // 1. Kiểm tra Chi nhánh
        RuleFor(x => x.BranchId)
            .NotEmpty().WithMessage("Chi nhánh sở hữu kho hàng không được để trống.");

        // 2. Kiểm tra Mã kho hàng
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã kho hàng không được phép để trống.")
            .MaximumLength(30).WithMessage("Mã kho hàng không được vượt quá 30 ký tự.")
            .Matches(@"^[a-zA-Z0-9_\-]+$").WithMessage("Mã kho hàng chỉ được phép chứa chữ cái, chữ số, dấu gạch dưới (_) hoặc gạch ngang (-).");

        // 3. Kiểm tra Tên kho hàng
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên kho hàng không được phép để trống.")
            .MaximumLength(100).WithMessage("Tên kho hàng không được vượt quá 100 ký tự.");
    }
}

/// <summary>
/// Trình kiểm tra dữ liệu đầu vào cho lệnh cập nhật thông tin kho hàng (UpdateWarehouseCommand).
/// </summary>
public class UpdateWarehouseCommandValidator : AbstractValidator<UpdateWarehouseCommand>
{
    public UpdateWarehouseCommandValidator()
    {
        // 1. Kiểm tra ID kho
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID kho hàng cần cập nhật không được để trống.");

        // 2. Kiểm tra Tên kho hàng mới
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên kho hàng không được phép để trống.")
            .MaximumLength(100).WithMessage("Tên kho hàng không được vượt quá 100 ký tự.");
    }
}
