# MASTER CONTEXT CHO AI SINH CODE

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật .NET 10)
**Phase:** 7 - AI Context

---

## 1. Mục đích
Tài liệu này (và các tài liệu trong thư mục Phase 7) được thiết kế ĐẶC BIỆT DÀNH CHO CÁC MÔ HÌNH AI đọc và hiểu toàn bộ bối cảnh dự án TRƯỚC KHI sinh mã nguồn (Source Code).
Khi bắt đầu một phiên làm việc mới để code, hãy nạp tệp này vào bộ nhớ của AI.

## 2. Thông tin Dự án Tổng Quan (Project Overview)
* **Tên dự án:** Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant.
* **Mô hình kiến trúc:** Clean Architecture, CQRS.
* **Ngôn ngữ Backend:** C# 14.
* **Framework Backend:** ASP.NET Core 10.0.301.
* **Database:** SQL Server 2022 Express.
* **ORM:** Entity Framework Core 10.0.9.
* **Thư viện chính:** MediatR, FluentValidation, Mapster, Serilog.

## 3. Cấu trúc Thư mục Code chuẩn (Solution)
Khi sinh code, AI BẮT BUỘC phải tuân thủ cấu trúc của 4 dự án:

```text
PhoneServicePlatform.slnx
  ├── PSP.Domain/           # Core Entities, Custom Exceptions, Enums (KHÔNG phụ thuộc EF Core hay thư viện ngoài)
  ├── PSP.Application/      # Commands, Queries, Handlers (MediatR), Validators (FluentValidation), DTOs, IRepository
  ├── PSP.Infrastructure/   # AppDbContext, Configurations (Fluent API), Repository Pattern, UnitOfWork
  └── PSP.API/              # Controllers, Middlewares, Program.cs
```

## 4. Thứ tự Đọc tài liệu cho AI (Reading Order)
Nếu AI cần hiểu sâu để sinh code chính xác, hãy yêu cầu AI đọc (view_file) các file theo thứ tự:
1. `Phase 7 - AI Context/CODING_RULE.md`: Nguyên tắc viết code C# chuẩn.
2. `Phase 7 - AI Context/DATABASE_RULE.md`: Nguyên tắc ánh xạ EF Core.
3. `Phase 7 - AI Context/API_RULE.md`: Nguyên tắc thiết kế REST Controller.
4. `Phase 7 - AI Context/BUSINESS_RULE_AI.md`: Các điều kiện nghiệp vụ cứng.
5. Xem lại `Phase 2 - Database Design` và mã nguồn `PSP.Domain` để biết schema thực tế trước khi code Repository và Handler.
