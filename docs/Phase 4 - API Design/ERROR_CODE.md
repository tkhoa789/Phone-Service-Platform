# ERROR CODE CATALOG

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật .NET 10)
**Phase:** 4 - API Design

---

## 1. Nguyên tắc thiết kế Mã lỗi (Error Code Principles)
Hệ thống sử dụng cơ chế xử lý lỗi tập trung để trả về phản hồi đồng bộ cho Client. Mỗi lỗi phát sinh đều có một **Mã lỗi duy nhất (Business Error Code)** giúp đội ngũ phát triển Frontend và kỹ thuật viên vận hành xác định chính xác nguyên nhân mà không cần đọc nhật ký máy chủ (Server logs).

Mỗi bản ghi lỗi được gửi về dưới dạng JSON tuân thủ:
* **HTTP Status Code:** Đại diện cho loại lỗi chung (e.g. 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error).
* **Business Error Code:** Mã định danh nghiệp vụ chi tiết dạng `<DOMAIN>_<NUMBER>` (e.g. `AUTH_002`, `INVENTORY_003`).
* **Message:** Thông báo lỗi thân thiện với người dùng (viết bằng tiếng Việt).

---

## 2. Danh mục mã lỗi chi tiết theo phân hệ

### 2.1 Lỗi Hệ thống & Chung (General & System Errors - Dải SYS_XXX)

| Mã lỗi (Error Code) | HTTP Status | Thông báo lỗi hiển thị | Giải trình / Hướng giải quyết |
| :--- | :--- | :--- | :--- |
| `SYS_001` | 500 | Lỗi hệ thống nội bộ | Lỗi không xác định của server, cần xem log. |
| `SYS_002` | 400 | Dữ liệu đầu vào không hợp lệ | Vi phạm các ràng buộc FluentValidation. |
| `SYS_003` | 400 | Định dạng dữ liệu không hợp lệ | Kiểu dữ liệu gửi lên không đúng. |
| `SYS_004` | 503 | Dịch vụ cơ sở dữ liệu tạm thời gián đoạn| Mất kết nối tới database SQL Server. |

---

### 2.2 Phân hệ Xác thực & Phân quyền (Authentication & Authorization - Dải AUTH_XXX)

| Mã lỗi (Error Code) | HTTP Status | Thông báo lỗi hiển thị | Giải trình / Hướng giải quyết |
| :--- | :--- | :--- | :--- |
| `AUTH_001` | 401 | Tên đăng nhập hoặc mật khẩu không chính xác| Tài khoản không khớp với cơ sở dữ liệu. |
| `AUTH_002` | 403 | Tài khoản đã bị khóa | Trạng thái tài khoản của User là bị khóa. |
| `AUTH_003` | 401 | Phiên làm việc đã hết hạn | Token JWT hết hiệu lực. |
| `AUTH_004` | 401 | Token không hợp lệ hoặc bị giả mạo | Chữ ký JWT sai lệch. |
| `AUTH_005` | 403 | Bạn không có quyền thực hiện chức năng này| Người dùng cố gắng gọi API mà không có Permission thích hợp. |

*(Các mã lỗi nghiệp vụ của Product, Inventory, Sales, Service, AI tương tự như cũ)*

---

## 3. Cách triển khai Global Exception Handler trong ASP.NET Core 10
Để tự động ánh xạ các Business Exception thành cấu trúc lỗi thống nhất, chúng ta sử dụng `GlobalExceptionMiddleware` trong project `PSP.API`:

```csharp
using System.Net;
using System.Text.Json;
using PSP.Application.Common.Models;
using PSP.Domain.Common.Exceptions;

namespace PSP.API.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var response = ApiResponse<object>.Fail("SYS_001", "Lỗi hệ thống nội bộ");
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        switch (exception)
        {
            case BusinessException e:
                response = ApiResponse<object>.Fail(e.ErrorCode ?? "SYS_002", e.Message);
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                break;
            case ValidationException e:
                response = ApiResponse<object>.Fail("SYS_002", e.Message);
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                break;
            case NotFoundException e:
                response = ApiResponse<object>.Fail("SYS_004", e.Message);
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                break;
        }

        var result = JsonSerializer.Serialize(response);
        return context.Response.WriteAsync(result);
    }
}
```
