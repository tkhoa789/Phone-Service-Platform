# API RULE (REST & CONTROLLER RULES)

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật .NET 10)
**Phase:** 7 - AI Context

---

## Các Quy tắc BẮT BUỘC khi AI sinh code API (Controller)

1. **BaseApiController:**
   - Mọi API Controller phải kế thừa từ `BaseApiController` (có sẵn thuộc tính `Mediator`).
   - Sử dụng attributes `[ApiController]` và `[Route("api/[controller]")]`.

2. **Giao tiếp qua CQRS:**
   - Controller KHÔNG chứa logic nghiệp vụ.
   - Controller CHỈ nhận Request, chuyển thành `Command`/`Query` và gửi qua `await Mediator.Send(command, cancellationToken)`.
   - Ví dụ:
     ```csharp
     [HttpPost]
     public async Task<IActionResult> Create([FromBody] CreateUserCommand command, CancellationToken cancellationToken)
     {
         var result = await Mediator.Send(command, cancellationToken);
         return Ok(ApiResponse<Guid>.Success(result));
     }
     ```

3. **Response Chuẩn:**
   - Luôn bọc kết quả trả về trong `ApiResponse<T>`.
   - Nếu có lỗi, `GlobalExceptionMiddleware` sẽ tự động catch và trả về `ApiResponse<T>.Fail()` kèm HTTP Status Code tương ứng (400, 404, 409).

4. **Phân quyền (Authorization):**
   - Đặt `[Authorize]` trên đầu Controller hoặc Action.
   - Dùng `[Authorize(Roles = "Admin,Manager")]` hoặc Policy tương ứng để phân quyền chặt chẽ.
   
5. **Pagination (Phân trang):**
   - API lấy danh sách (GET) BẮT BUỘC phải hỗ trợ phân trang (nhận `PageIndex`, `PageSize` trong Query parameter). Trả về object chứa dữ liệu list và tổng số bản ghi.
