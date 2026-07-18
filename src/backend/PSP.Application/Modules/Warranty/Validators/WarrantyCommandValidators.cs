using FluentValidation;
using PSP.Application.Modules.Warranty.Commands;

namespace PSP.Application.Modules.Warranty.Validators;

/// <summary>
/// Trình kiểm tra dữ liệu đầu vào cho CreateWarrantyTicketCommand.
/// </summary>
public class CreateWarrantyTicketCommandValidator : AbstractValidator<CreateWarrantyTicketCommand>
{
    public CreateWarrantyTicketCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Mã khách hàng không được để trống.");

        RuleFor(x => x.ProductVariantId)
            .NotEmpty().WithMessage("Mã dòng sản phẩm không được để trống.");

        RuleFor(x => x.Imei)
            .NotEmpty().WithMessage("Số IMEI thiết bị bảo hành không được để trống.")
            .Length(14, 18).WithMessage("Độ dài mã số IMEI phải từ 14 đến 18 ký tự.");
    }
}

/// <summary>
/// Trình kiểm tra dữ liệu đầu vào cho UpdateWarrantyStatusCommand.
/// </summary>
public class UpdateWarrantyStatusCommandValidator : AbstractValidator<UpdateWarrantyStatusCommand>
{
    public UpdateWarrantyStatusCommandValidator()
    {
        RuleFor(x => x.WarrantyTicketId)
            .NotEmpty().WithMessage("Mã phiếu bảo hành không được để trống.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái chuyển dịch không hợp lệ.");

        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Hành động xử lý bảo hành không được để trống.")
            .MaximumLength(100).WithMessage("Hành động xử lý không được vượt quá 100 ký tự.");

        RuleFor(x => x.NewImei)
            .Length(14, 18).WithMessage("Độ dài số IMEI mới phải từ 14 đến 18 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.NewImei));
    }
}
