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
            .MaximumLength(1000).WithMessage("Mô tả lỗi không được vượt quá 1000 ký tự.");

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

        RuleFor(x => x.ActualCost)
            .GreaterThanOrEqualTo(0).WithMessage("Chi phí thực tế không được là số âm.")
            .When(x => x.ActualCost.HasValue);
    }
}
