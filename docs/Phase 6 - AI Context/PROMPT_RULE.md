# PROMPT RULE CHO AI

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật .NET 10)
**Phase:** 7 - AI Context

---

## 1. Yêu cầu khi AI sinh Code
Khi người dùng yêu cầu "Sinh code tính năng A", AI phải thực hiện đủ các bước sau:
1. **Kiểm tra Model:** Đảm bảo sử dụng thư viện/hướng dẫn của C#/.NET 10, CQRS MediatR.
2. **Sinh DTO/Command/Query:** Định nghĩa input/output (Record types).
3. **Sinh Validator:** Tạo class kế thừa `AbstractValidator<T>` từ FluentValidation.
4. **Sinh Handler:** Tạo class kế thừa `IRequestHandler<TRequest, TResponse>`, inject `IUnitOfWork`. Thực thi nghiệp vụ và `SaveChangesAsync`.
5. **Sinh Controller:** Thêm endpoint tương ứng gọi Mediator.

## 2. Format Code sinh ra
* Phải có block code rõ ràng (````csharp ... ````).
* Kèm theo đường dẫn file được đề xuất (ví dụ: `PSP.Application/Modules/Auth/Commands/LoginCommand.cs`).
* Cố gắng gom nhóm code hợp lý, nhưng không nên sinh một file dài 1000 dòng.

## 3. Xác nhận và Tương tác
* Không tự ý chạy các lệnh xoá thư mục hoặc tạo file nén trừ khi được yêu cầu.
* Nếu thiếu thông tin (ví dụ: Không rõ quy định đổi trạng thái bảo hành), AI phải chủ động hỏi lại thay vì tự bịa ra logic.
