using FluentValidation;
using PSP.Application.Modules.Sales.Commands;

namespace PSP.Application.Modules.Sales.Validators;

/// <summary>
/// Trình kiểm tra (Validators) cho các lệnh của Chương trình khuyến mãi.
/// 
/// Dành cho người mới học và trình độ dưới junior:
/// - Thư viện FluentValidation giúp viết code kiểm định form dữ liệu gọn gàng và dễ đọc.
/// - Ngăn chặn dữ liệu rác, ngày tháng mâu thuẫn hoặc giá trị âm lọt vào CSDL.
/// </summary>
public class CreatePromotionCommandValidator : AbstractValidator<CreatePromotionCommand>
{
    public CreatePromotionCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã khuyến mãi không được để trống.")
            .MaximumLength(30).WithMessage("Mã khuyến mãi tối đa 30 ký tự.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên chương trình khuyến mãi không được để trống.")
            .MaximumLength(150).WithMessage("Tên chương trình tối đa 150 ký tự.");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Loại khuyến mãi không được để trống.")
            .Must(x => x == "PERCENTAGE" || x == "DIRECT_VALUE")
            .WithMessage("Loại khuyến mãi chỉ chấp nhận 'PERCENTAGE' (phần trăm) hoặc 'DIRECT_VALUE' (tiền mặt).");

        RuleFor(x => x.Value)
            .GreaterThan(0).WithMessage("Giá trị khuyến mãi phải lớn hơn 0.");

        // Nếu loại khuyến mãi là PERCENTAGE thì giá trị % tối đa chỉ được là 100%
        RuleFor(x => x.Value)
            .LessThanOrEqualTo(100).WithMessage("Giá trị khuyến mãi phần trăm (%) không được lớn hơn 100.")
            .When(x => x.Type == "PERCENTAGE");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Ngày bắt đầu không được để trống.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("Ngày kết thúc không được để trống.")
            .GreaterThan(x => x.StartDate).WithMessage("Ngày kết thúc phải lớn hơn ngày bắt đầu.");
    }
}

public class UpdatePromotionCommandValidator : AbstractValidator<UpdatePromotionCommand>
{
    public UpdatePromotionCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id chương trình khuyến mãi không hợp lệ.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên chương trình khuyến mãi không được để trống.")
            .MaximumLength(150).WithMessage("Tên chương trình tối đa 150 ký tự.");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Loại khuyến mãi không được để trống.")
            .Must(x => x == "PERCENTAGE" || x == "DIRECT_VALUE")
            .WithMessage("Loại khuyến mãi chỉ chấp nhận 'PERCENTAGE' hoặc 'DIRECT_VALUE'.");

        RuleFor(x => x.Value)
            .GreaterThan(0).WithMessage("Giá trị khuyến mãi phải lớn hơn 0.");

        RuleFor(x => x.Value)
            .LessThanOrEqualTo(100).WithMessage("Giá trị khuyến mãi phần trăm (%) không được lớn hơn 100.")
            .When(x => x.Type == "PERCENTAGE");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Ngày bắt đầu không được để trống.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("Ngày kết thúc không được để trống.")
            .GreaterThan(x => x.StartDate).WithMessage("Ngày kết thúc phải lớn hơn ngày bắt đầu.");
    }
}
