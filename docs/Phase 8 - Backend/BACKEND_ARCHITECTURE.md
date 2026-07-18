# BACKEND ARCHITECTURE & DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật theo dự án thực tế .NET 10)
**Phase:** 8 - Backend

---

## 1. Công nghệ Sử dụng
* **Ngôn ngữ:** C# 14.
* **Framework:** ASP.NET Core 10.0.301.
* **Database:** SQL Server 2022 Express.
* **ORM:** Entity Framework Core 10.0.9.
* **CQRS Mediator:** MediatR 12.5.0.
* **Validation & Mapping:** FluentValidation 12.1.1, Mapster 10.0.10.
* **Logging:** Serilog.
* **AI Integration:** Ollama (có thể kết hợp Microsoft Semantic Kernel).

## 2. Kiến trúc Clean Architecture + CQRS

Ứng dụng chia thành 4 Project chính (Solution `PhoneServicePlatform.slnx`):
1. **PSP.Domain (Lớp cốt lõi):** Chứa các `BaseEntity`, Custom Exceptions (`BusinessException`, `NotFoundException`), Enums và toàn bộ Entity thuộc các modules: Auth, Branch, Product, Inventory, Sales, Warranty, Repair, AI.
2. **PSP.Application (Lớp Ứng dụng):** Chứa CQRS (Commands, Queries, Handlers), Validators (sử dụng `FluentValidation`), Interfaces (`IRepository`, `IUnitOfWork`), và DTOs.
3. **PSP.Infrastructure (Lớp Hạ tầng):** Chứa `AppDbContext` (EF Core), cấu hình Fluent API, Repository pattern, Unit of Work, và các cấu hình kết nối ngoài.
4. **PSP.API (Lớp Giao diện):** Cung cấp các RESTful APIs thông qua Controllers, xử lý lỗi toàn cục (`GlobalExceptionMiddleware`), cấu hình Swagger và JWT Authentication.

## 3. Quản lý Giao dịch (Transaction Management) & Database
* **Unit of Work Pattern:** Giao dịch được quản lý bởi `IUnitOfWork`. `IUnitOfWork.SaveChangesAsync()` chỉ được gọi một lần ở cuối Handler để đảm bảo tính nguyên vẹn dữ liệu (Atomic).
* **Repository Pattern:** Truy xuất dữ liệu thông qua `IRepository<T>` (tránh dùng `AppDbContext` trực tiếp trong Application Layer).
* **Soft Delete:** Mọi Entity kế thừa `BaseEntity` đều có cờ `IsDeleted`. Xóa dữ liệu không dùng lệnh DELETE SQL, mà cập nhật `IsDeleted = true`. Có cấu hình Global Query Filter trong EF Core để tự động bỏ qua record đã xóa.
* **Cascade Delete:** Đã được vô hiệu hóa toàn cục trong `AppDbContext` để tránh xóa lan tràn.

## 4. Bảo mật (Security)
* Dùng **JWT Bearer Authentication**.
* Role-based Access Control (RBAC): Admin, Manager, Sales, Technician.
* Token có cấu trúc phân quyền động, được kiểm tra qua các Policy trong Controller.
* Mọi HTTP request phải mang Token hợp lệ, ngoại trừ Auth endpoints (Login, Refresh Token).
