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

/// <summary>
/// Trình kiểm tra cho RejectWarrantyCommand.
/// </summary>
public class RejectWarrantyCommandValidator : AbstractValidator<RejectWarrantyCommand>
{
    public RejectWarrantyCommandValidator()
    {
        RuleFor(x => x.WarrantyTicketId)
            .NotEmpty().WithMessage("Mã phiếu bảo hành không được để trống.");

        RuleFor(x => x.Reason)
            .IsInEnum().WithMessage("Lý do từ chối bảo hành không hợp lệ.");

        RuleFor(x => x.RejectNotes)
            .NotEmpty().WithMessage("Vui lòng nhập lý do giải trình chi tiết khi từ chối bảo hành.")
            .MaximumLength(1000).WithMessage("Ghi chú từ chối không được vượt quá 1000 ký tự.");

        RuleFor(x => x.EvidencePhotoUrls)
            .MaximumLength(2000).WithMessage("Đường dẫn ảnh bằng chứng không được vượt quá 2000 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Phiên bản dữ liệu (RowVersion) không được để trống.");
    }
}

/// <summary>
/// Trình kiểm tra cho TransferToInHouseRepairCommand.
/// </summary>
public class TransferToInHouseRepairCommandValidator : AbstractValidator<TransferToInHouseRepairCommand>
{
    public TransferToInHouseRepairCommandValidator()
    {
        RuleFor(x => x.WarrantyTicketId)
            .NotEmpty().WithMessage("Mã phiếu bảo hành không được để trống.");

        RuleFor(x => x.ComponentDiagnosis)
            .NotEmpty().WithMessage("Chẩn đoán linh kiện lỗi không được để trống.")
            .MaximumLength(1000).WithMessage("Nội dung chẩn đoán không được vượt quá 1000 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Phiên bản dữ liệu (RowVersion) không được để trống.");
    }
}

/// <summary>
/// Trình kiểm tra cho ReplaceDeviceCommand.
/// </summary>
public class ReplaceDeviceCommandValidator : AbstractValidator<ReplaceDeviceCommand>
{
    public ReplaceDeviceCommandValidator()
    {
        RuleFor(x => x.WarrantyTicketId)
            .NotEmpty().WithMessage("Mã phiếu bảo hành không được để trống.");

        RuleFor(x => x.NewImei)
            .NotEmpty().WithMessage("Số IMEI máy mới đổi không được để trống.")
            .Length(14, 18).WithMessage("Độ dài số IMEI máy mới phải từ 14 đến 18 ký tự.");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Lý do đổi máy không được vượt quá 500 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Phiên bản dữ liệu (RowVersion) không được để trống.");
    }
}

/// <summary>
/// Trình kiểm tra cho SendToVendorCommand.
/// </summary>
public class SendToVendorCommandValidator : AbstractValidator<SendToVendorCommand>
{
    public SendToVendorCommandValidator()
    {
        RuleFor(x => x.WarrantyTicketId)
            .NotEmpty().WithMessage("Mã phiếu bảo hành không được để trống.");

        RuleFor(x => x.VendorName)
            .NotEmpty().WithMessage("Tên trung tâm bảo hành Hãng/NCC không được để trống.")
            .MaximumLength(200).WithMessage("Tên trung tâm bảo hành Hãng không được vượt quá 200 ký tự.");

        RuleFor(x => x.VendorTicketNumber)
            .NotEmpty().WithMessage("Mã phiếu tiếp nhận của Hãng không được để trống.")
            .MaximumLength(100).WithMessage("Mã phiếu Hãng không được vượt quá 100 ký tự.");

        RuleFor(x => x.TrackingNumber)
            .NotEmpty().WithMessage("Mã vận đơn gửi hàng không được để trống.")
            .MaximumLength(100).WithMessage("Mã vận đơn không được vượt quá 100 ký tự.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Ghi chú không được vượt quá 1000 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Phiên bản dữ liệu (RowVersion) không được để trống.");
    }
}

/// <summary>
/// Trình kiểm tra cho DeliverToCustomerCommand.
/// </summary>
public class DeliverToCustomerCommandValidator : AbstractValidator<DeliverToCustomerCommand>
{
    public DeliverToCustomerCommandValidator()
    {
        RuleFor(x => x.WarrantyTicketId)
            .NotEmpty().WithMessage("Mã phiếu bảo hành không được để trống.");

        RuleFor(x => x.ReceiverName)
            .MaximumLength(200).WithMessage("Tên người nhận máy không được vượt quá 200 ký tự.");

        RuleFor(x => x.Notes)
            .MaximumLength(1000).WithMessage("Ghi chú bàn giao không được vượt quá 1000 ký tự.");

        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Phiên bản dữ liệu (RowVersion) không được để trống.");
    }
}

