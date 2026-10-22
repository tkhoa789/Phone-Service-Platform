# DATABASE RULE (EF CORE RULES)

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật .NET 10)
**Phase:** 7 - AI Context

---

## Các Quy tắc BẮT BUỘC khi AI sinh code Entity/EF Core

1. **Khóa chính (Primary Key):**
   - LUÔN sử dụng `Guid` cho thuộc tính `Id` trong các Entity. Tránh dùng auto-increment integer trừ khi có yêu cầu đặc biệt.
   - Các Entity đều kế thừa từ `BaseEntity` (đã khai báo sẵn Guid Id).

2. **Kiểm soát Thời gian & Người dùng (Auditing):**
   - Lớp `BaseEntity` đã có sẵn các trường: `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`.
   - Các trường này được tự động gán giá trị tại `AppDbContext.SaveChangesAsync()` thông qua `ICurrentUserService`.

3. **Soft Delete (Xóa mềm):**
   - Kế thừa `BaseEntity` nghĩa là có sẵn trường `IsDeleted` (bool) và `DeletedAt`.
   - Trong cấu hình `AppDbContext` đã có Global Query Filter (`HasQueryFilter(e => !e.IsDeleted)`) tự động áp dụng để bỏ qua dữ liệu đã xoá.
   - Repositories chỉ cần gọi hàm `.Remove(entity)` (thực tế hàm này sẽ cập nhật trạng thái `IsDeleted = true`).

4. **Tránh N+1 Query:**
   - Khi load dữ liệu có quan hệ qua `IRepository`, nếu cần lấy cả quan hệ thì hãy cẩn thận sử dụng EF Core `.Include()`.
   - Không lạm dụng việc Include quá sâu.
   
5. **Cấu hình Fluent API:**
   - Không dùng Data Annotations (`[Table]`, `[Column]`) trên Entity.
   - BẮT BUỘC dùng Fluent API trong project `PSP.Infrastructure` (tạo các class kế thừa `IEntityTypeConfiguration<TEntity>`).
   
6. **Không Cascade Delete:**
   - Tránh xóa lan truyền gây mất mát dữ liệu hàng loạt. `AppDbContext` đã cấu hình tắt `Cascade Delete` toàn cục.
