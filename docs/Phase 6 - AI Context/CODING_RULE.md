# CODING RULE (C# & ASP.NET CORE)

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật .NET 10)
**Phase:** 7 - AI Context

---

## 1. Clean Architecture Strict Rules
* **Domain KHÔNG được biết về cơ sở dữ liệu hay framework:** Các class trong thư mục `PSP.Domain` KHÔNG được reference đến `Microsoft.EntityFrameworkCore` hay các thư viện ngoại lai, ngoại trừ các thư viện cốt lõi của .NET.
* **Dependency Injection:** Sử dụng Constructor Injection (khai báo private readonly field và gán qua constructor).
* **Giao tiếp giữa các Module:** Mọi Request được xử lý qua `MediatR` (CQRS). Handler của module này có thể gọi `IRepository` của module khác nếu cần, nhưng phải cùng nằm trong một Transaction của `IUnitOfWork`.

## 2. Xử lý Logic & Exception
* **Tuyệt đối không Throw Exception chung chung:** Phải tạo/sử dụng các Custom Exceptions như `BusinessException`, `NotFoundException`, `ConflictException`.
* **Sử dụng ApiResponse:** Các Controller không trả về trực tiếp Object mà phải bọc trong `ApiResponse<T>.Success()` hoặc `ApiResponse<T>.Fail()`.

## 3. Validations
* Dữ liệu đầu vào phải được kiểm tra bằng `FluentValidation`.
* Các validator class (ví dụ `CreateUserCommandValidator`) sẽ tự động được thực thi nhờ `ValidationBehavior` tích hợp trong MediatR Pipeline. Controller KHÔNG cần gọi `ModelState.IsValid`.

## 4. DTO và Mapping
* Không trả trực tiếp Entity ra Controller. Phải map sang ResponseDTO.
* Sử dụng **Mapster** (`.Adapt<T>()`) để mapping dữ liệu.
* Record types có thể được sử dụng cho Commands và Queries để đảm bảo tính bất biến (Immutable).

## 5. Bất đồng bộ (Async/Await)
* BẮT BUỘC sử dụng `async Task` và `await` cho tất cả các thao tác I/O (Database, Network, File).
* Luôn truyền `CancellationToken` từ Controller xuống Handler và các hàm của EF Core (`SaveChangesAsync`, `ToListAsync`, v.v.).
