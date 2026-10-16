using FluentValidation;
using PSP.Application.Modules.AI.Commands;

namespace PSP.Application.Modules.AI.Validators;

/// <summary>
/// BỘ XÁC THỰC LỆNH CHAT VỚI AI (SendAIMessageCommandValidator)
/// 
/// Lập trình viên mới học: Chúng ta sử dụng thư viện FluentValidation để kiểm tra ràng buộc đầu vào.
/// Đảm bảo người dùng không gửi câu hỏi rỗng hoặc chỉ có khoảng trắng lên AI.
/// </summary>
public class SendAIMessageCommandValidator : AbstractValidator<SendAIMessageCommand>
{
    public SendAIMessageCommandValidator()
    {
        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("Nội dung tin nhắn không được để trống.")
            .MaximumLength(2000).WithMessage("Nội dung tin nhắn không được vượt quá 2000 ký tự.");
    }
}

/// <summary>
/// BỘ XÁC THỰC LỆNH NẠP TÀI LIỆU TRI THỨC (IngestKnowledgeDocumentCommandValidator)
/// 
/// Đảm bảo tài liệu nạp vào Qdrant và SQL Server có đầy đủ tiêu đề, nội dung và phân loại nguồn.
/// </summary>
public class IngestKnowledgeDocumentCommandValidator : AbstractValidator<IngestKnowledgeDocumentCommand>
{
    public IngestKnowledgeDocumentCommandValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tiêu đề tài liệu không được để trống.")
            .MaximumLength(200).WithMessage("Tiêu đề tài liệu không được dài quá 200 ký tự.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Nội dung tài liệu không được để trống.");

        RuleFor(x => x.SourceType)
            .NotEmpty().WithMessage("Phân loại loại nguồn tài liệu không được để trống.")
            .MaximumLength(50).WithMessage("Loại nguồn tài liệu không dài quá 50 ký tự.");
    }
}
