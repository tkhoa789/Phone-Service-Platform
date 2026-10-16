using FluentValidation;
using PSP.Application.Modules.Repair.Commands;

namespace PSP.Application.Modules.Repair.Validators;

/// <summary>
/// Trình kiểm tra dữ liệu đầu vào (Validator) cho CreateRepairTicketCommand.
/// </summary>
public class CreateRepairTicketCommandValidator : AbstractValidator<CreateRepairTicketCommand>
{
    public CreateRepairTicketCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Mã khách hàng không được để trống.");

        RuleFor(x => x.ProductVariantId)
            .NotEmpty().WithMessage("Mã biến thể thiết bị sửa không được để trống.");

        RuleFor(x => x.ProblemDescription)
            .NotEmpty().WithMessage("Mô tả lỗi của thiết bị không được để trống.")
            .Must(desc => !string.IsNullOrWhiteSpace(desc) && desc.Trim().Length >= 3)
            .WithMessage("Mô tả lỗi của thiết bị phải chứa ít nhất 3 ký tự hợp lệ.")
            .MaximumLength(1000).WithMessage("Mô tả lỗi không được vượt quá 1000 ký tự.");

        RuleFor(x => x.ExteriorCondition)
            .MaximumLength(500).WithMessage("Tình trạng ngoại quan không được vượt quá 500 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.ExteriorCondition));

        RuleFor(x => x.CustomModelName)
            .MaximumLength(200).WithMessage("Tên model tùy chỉnh không được vượt quá 200 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.CustomModelName));

        RuleFor(x => x.Imei)
            .MaximumLength(18).WithMessage("Số IMEI không được vượt quá 18 ký tự.")
            .When(x => !string.IsNullOrEmpty(x.Imei));

        RuleFor(x => x.EstimatedCost)
            .GreaterThanOrEqualTo(0).WithMessage("Chi phí dự kiến không được là số âm.")
            .When(x => x.EstimatedCost.HasValue);
    }
}

/// <summary>
/// Trình kiểm tra dữ liệu đầu vào cho AddRepairPartCommand.
/// </summary>
public class AddRepairPartCommandValidator : AbstractValidator<AddRepairPartCommand>
{
    public AddRepairPartCommandValidator()
    {
        RuleFor(x => x.RepairTicketId)
            .NotEmpty().WithMessage("Mã phiếu sửa chữa không được để trống.");

        RuleFor(x => x.ProductVariantId)
            .NotEmpty().WithMessage("Mã linh kiện thay thế không được để trống.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Số lượng linh kiện xuất ra phải lớn hơn 0.");
    }
}

/// <summary>
/// Trình kiểm tra dữ liệu đầu vào cho UpdateRepairStatusCommand.
/// </summary>
public class UpdateRepairStatusCommandValidator : AbstractValidator<UpdateRepairStatusCommand>
{
    public UpdateRepairStatusCommandValidator()
    {
        RuleFor(x => x.RepairTicketId)
            .NotEmpty().WithMessage("Mã phiếu sửa chữa không được để trống.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Trạng thái chuyển dịch không hợp lệ.");
    }
}

public class AssignTechnicianCommandValidator : AbstractValidator<AssignTechnicianCommand>
{
    public AssignTechnicianCommandValidator()
    {
        RuleFor(x => x.RepairTicketId)
            .NotEmpty().WithMessage("Mã phiếu sửa chữa không được để trống.");
        RuleFor(x => x.TechnicianId)
            .NotEmpty().WithMessage("Mã kỹ thuật viên không được để trống.");
    }
}

public class SubmitDiagnosisCommandValidator : AbstractValidator<SubmitDiagnosisCommand>
{
    public SubmitDiagnosisCommandValidator()
    {
        RuleFor(x => x.RepairTicketId)
            .NotEmpty().WithMessage("Mã phiếu sửa chữa không được để trống.");
        RuleFor(x => x.RootCause)
            .NotEmpty().WithMessage("Nguyên nhân lỗi không được để trống.")
            .MaximumLength(500);
        RuleFor(x => x.ProposedSolution)
            .NotEmpty().WithMessage("Phương án sửa chữa không được để trống.")
            .MaximumLength(500);
        RuleFor(x => x.EstimatedCost)
            .GreaterThanOrEqualTo(0).WithMessage("Chi phí ước tính không được là số âm.")
            .When(x => x.EstimatedCost.HasValue);
    }
}

public class ApproveRepairCommandValidator : AbstractValidator<ApproveRepairCommand>
{
    public ApproveRepairCommandValidator()
    {
        RuleFor(x => x.RepairTicketId)
            .NotEmpty().WithMessage("Mã phiếu sửa chữa không được để trống.");
        RuleFor(x => x.ApprovedAmount)
            .GreaterThanOrEqualTo(0).WithMessage("Chi phí phê duyệt không được là số âm.");
        RuleFor(x => x.ApprovalMethod)
            .NotEmpty().WithMessage("Phương thức xác nhận của khách không được để trống.");
    }
}

public class DeliverRepairCommandValidator : AbstractValidator<DeliverRepairCommand>
{
    public DeliverRepairCommandValidator()
    {
        RuleFor(x => x.RepairTicketId)
            .NotEmpty().WithMessage("Mã phiếu sửa chữa không được để trống.");
        RuleFor(x => x.ReceiverName)
            .NotEmpty().WithMessage("Tên người nhận máy không được để trống.")
            .MaximumLength(200);
    }
}
