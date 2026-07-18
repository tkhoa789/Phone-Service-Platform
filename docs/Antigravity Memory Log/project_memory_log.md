# NHẬT KÝ KÝ ỨC DỰ ÁN (PROJECT MEMORY LOG)
## PHONE SERVICE PLATFORM (PSP) - ENTERPRISE REPAIR & RETAIL MANAGEMENT SYSTEM

**Cập nhật lần cuối:** 17/07/2026 10:37 PM

---

## 1. THÔNG TIN CHUNG DỰ ÁN

* **Tên chính thức**: Phone Service Platform (PSP)
* **Tên thương mại**: Enterprise Phone Repair & Retail Management System
* **Thư mục dự án**: `D:\Phone-Service-Platform`
* **Thư mục tài liệu**: `D:\Tai Lieu DACN`
* **Vai trò của AI (Antigravity)**: PM & Architecture Advisor. Không viết code trực tiếp - tập trung Review, Architecture, Business Rule, Naming, Performance, Security, Prompt, Test Cases.
* **Quy tắc đặt tên Swagger (API Grouping)**: Các tag nhóm Controller trong Swagger phải sử dụng danh từ tiếng Anh số nhiều hoặc tên phân hệ ngắn gọn (Ví dụ: `Authorization`, `Branches`, `Users`).
* **Quy tắc thao tác Git/GitHub**: AI tuyệt đối không tự ý thực hiện commit, push, merge hoặc bất kỳ lệnh nào tương tự tác động lên GitHub repository khi chưa được USER cho phép rõ ràng trong phiên làm việc.

---

## 2. TECH STACK ĐÃ CHỐT

| Hạng mục | Công nghệ | Phiên bản |
| :--- | :--- | :--- |
| Backend | ASP.NET Core | .NET 10.0.301 |
| IDE | Visual Studio Insider 2026 | - |
| Database | SQL Server 2022 Express | `.\SQLEXPRESS` |
| ORM | Entity Framework Core | 10.0.9 |
| Architecture | Clean Architecture + CQRS + MediatR + Repository + UoW + DDD Lite | - |
| CQRS Mediator | MediatR | 12.5.0 |
| Validation | FluentValidation | 12.1.1 |
| Mapping | Mapster | 10.0.10 |
| Auth | JWT + Refresh Token + RBAC | JwtBearer |
| Logging | Serilog (File + SQL Server) | AspNetCore |
| API Docs | Swashbuckle (Swagger) | 10.2.3 |
| AI | Ollama + Qwen 3 + Qdrant + RAG | (Chưa tích hợp) |
| Frontend | CoreUI Free hoặc AdminLTE | (Chưa bắt đầu) |
| Cache | Redis | (Chưa cài đặt) |
| Background Job | Hangfire | (Chưa cài đặt) |
| Container | Docker Compose | (Chưa cấu hình) |

---

## 3. NHẬT KÝ CÀI ĐẶT MÔI TRƯỜNG (ENVIRONMENT LOG)

| Thời gian | Hành động | Trạng thái |
| :--- | :--- | :--- |
| 13/07 23:36 | Khảo sát tài liệu `D:\Tai Lieu DACN` (11 Phase) | ✅ Hoàn thành |
| 13/07 23:37 | Kiểm tra Node.js (`v24.18.0`) và npm (`11.16.0`) | ✅ Đã có sẵn |
| 14/07 01:22 | Cài đặt SSMS - gặp lỗi treo kết nối `.\SQLEXPRESS` | ⚠️ Thiếu DB Engine |
| 14/07 01:26 | Tải và cài đặt SQL Server 2022 Express (Basic mode) | ✅ Hoàn thành |
| 14/07 01:31 | Kết nối SSMS thành công: `.\SQLEXPRESS`, Windows Auth, Trust Cert | ✅ Hoàn thành |
| 14/07 03:40 | Xác nhận .NET SDK 10.0.301 trên máy (tại `C:\Program Files\dotnet`) | ✅ Hoàn thành |

---

## 4. TIẾN ĐỘ THỰC HIỆN TÁC VỤ (TASK LOG)

### ✅ Phase 1: Cấu trúc thư mục GitHub Repository
- [x] Tạo thư mục `D:\Phone-Service-Platform`
- [x] Tạo các thư mục con: `docs`, `src/backend`, `src/frontend`, `database`, `docker`, `scripts`, `postman`, `ai`, `test`

### ✅ Phase 2: Khởi tạo Solution & Projects
- [x] Tạo Blank Solution `PhoneServicePlatform.slnx` tại `src/backend` (.NET 10 sử dụng format `.slnx`)
- [x] Tạo `PSP.Domain` (Class Library - .NET 10)
- [x] Tạo `PSP.Application` (Class Library - .NET 10)
- [x] Tạo `PSP.Infrastructure` (Class Library - .NET 10)
- [x] Tạo `PSP.API` (ASP.NET Core Web API - .NET 10, Use Controllers)
- [x] Thêm 4 projects vào Solution
- [x] Cấu hình Project References:
  * `PSP.Application` → `PSP.Domain` ✅
  * `PSP.Infrastructure` → `PSP.Application` ✅
  * `PSP.API` → `PSP.Application` + `PSP.Infrastructure` ✅

### ✅ Phase 3: Cài đặt NuGet Packages
- [x] PSP.Application: MediatR 12.5.0, FluentValidation 12.1.1, Mapster 10.0.10
- [x] PSP.Infrastructure: EF Core SqlServer 10.0.9, EF Core Design 10.0.9, EF Core Tools 10.0.9
- [x] PSP.API: JwtBearer, Serilog.AspNetCore, Serilog.Sinks.MSSqlServer 10.0.0, Serilog.Sinks.File 7.0.0, Swashbuckle.AspNetCore 10.2.3

### ✅ Phase 4: Domain Layer - Entities & Enums
- [x] Tạo `BaseEntity` (Guid Id, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, IsDeleted, DeletedAt)
- [x] Tạo tất cả Enums nghiệp vụ (ImeiStatus, BranchStatus, UserStatus, SalesOrderStatus, RepairTicketStatus...)
- [x] Tạo Custom Exceptions (BusinessException, NotFoundException, ConflictException, InventoryNotEnoughException, InvalidRepairStatusTransitionException...)
- [x] Tạo BranchEntity (ERD Section 3.1)
- [x] Tạo Auth Entities: UserEntity, RoleEntity, PermissionEntity, UserRoleEntity, RolePermissionEntity, RefreshTokenEntity, LoginHistoryEntity, AuditLogEntity (ERD Section 3.1)
- [x] Tạo Product Entities: CategoryEntity, BrandEntity, ProductEntity, ProductVariantEntity, SupplierEntity (ERD Section 3.2)
- [x] Tạo Inventory Entities: WarehouseEntity, InventoryEntity, ImeiEntity, PurchaseOrderEntity, WarehouseTransferEntity, StockTakeEntity (ERD Section 3.2)
- [x] Tạo Customer Entity (ERD Section 3.3)
- [x] Tạo Sales Entities: PromotionEntity, VoucherEntity, SalesOrderEntity, SalesOrderItemEntity, InvoiceEntity, PaymentEntity (ERD Section 3.3)
- [x] Tạo Warranty Entities: WarrantyTicketEntity, WarrantyHistoryEntity (ERD Section 3.4)
- [x] Tạo Repair Entities: RepairTicketEntity, RepairPartEntity, RepairStatusHistoryEntity (ERD Section 3.4)
- [x] Tạo Notification & FileAttachment Entities (ERD Section 3.4)
- [x] Tạo AI Entities: AIConversationEntity, AIMessageEntity, AIToolCallEntity, AIKnowledgeDocumentEntity (ERD Section 3.5)
- [x] **BUILD SUCCEEDED - 0 Errors, 0 Warnings** ✅

### ✅ Phase 5: Application Layer - Thiết lập Interface & CQRS
- [x] Tạo `IRepository<T>`, `IUnitOfWork`, `ICurrentUserService`
- [x] Tạo `ApiResponse<T>`
- [x] Tạo `ValidationBehavior<TRequest, TResponse>`

### ✅ Phase 6: Infrastructure Layer - EF Core & SQL Server
- [x] Tạo `AppDbContext` với DbSet cho các thực thể và cấu hình Soft Delete (IsDeleted == false)
- [x] Cấu hình Fluent API cho `UserRoleEntity` và `RolePermissionEntity`

### ✅ Phase 7: API Layer - Presentation & Pipeline
- [x] Tạo `BaseApiController`
- [x] Tạo `GlobalExceptionMiddleware` để bắt lỗi và trả về `ApiResponse`
- [x] **BUILD SUCCEEDED - 0 Errors, 0 Warnings** ✅

### ✅ Phase 8: Cấu hình Dependency Injection & Repositories
- [x] Triển khai `Repository<T>` và `UnitOfWork`
- [x] Thêm `CurrentUserService` 
- [x] Cấu hình DI cho Application và Infrastructure
- [x] Đăng ký Swagger và Middleware trong `Program.cs`

### ✅ Phase 9: Cấu hình Database & EF Core Migrations
- [x] Khai báo chuỗi kết nối SQL Server vào `appsettings.json`
- [x] Cấu hình `InventoryConfiguration` (tạo Primary Keys riêng cho Imei, Inventory, etc.)
- [x] Tắt Cascade Delete toàn cục trong `AppDbContext`
- [x] Cài package `Microsoft.EntityFrameworkCore.Design`
- [x] Chạy `dotnet ef migrations add InitialCreate`
- [x] Chạy `dotnet ef database update` tạo Database thành công!

### ✅ Phase 10: Phát triển Core Modules (Foundation)
- [x] Cập nhật chuẩn CQRS Strict: Bổ sung `GetQueryableAsNoTracking()` vào `IRepository` để tối ưu 100% hiệu năng Query.
- [x] Triển khai Module Branch: Tách biệt hoàn toàn `BranchCommandHandlers` và `BranchQueryHandlers`.
- [x] Áp dụng DTOs, FluentValidation, BaseApiController cho Branch.

### ✅ Phase 11: Auth Enterprise Flow hoàn chỉnh (15/07/2026)
- [x] **IPasswordHasher + BCrypt.Net-Next**: Mật khẩu được băm chuẩn bảo mật. KHÔNG còn lưu plaintext.
- [x] **IAuthService + AuthService**: Interface chuyên biệt cho Auth, xử lý các bảng join phức tạp (UserRole, RolePermission) mà IRepository<T> không đảm nhận được.
- [x] **AppDbContext override SaveChangesAsync**: Tự động gán `CreatedBy`/`UpdatedBy` từ `ICurrentUserService` → audit hoàn toàn tự động.
- [x] **LoginCommandHandler** (7 bước): Tìm user → Kiểm tra status → BCrypt verify → Lấy Role/Permission → Sinh JWT+RefreshToken → Lưu RefreshToken DB → Ghi LoginHistory.
- [x] **LogoutCommandHandler**: Thu hồi RefreshToken (Revoke) trong DB khi đăng xuất.
- [x] **RefreshTokenCommandHandler**: Token Rotation pattern - thu hồi token cũ, cấp cặp token mới hoàn toàn.
- [x] **DatabaseSeeder**: Tự động tạo dữ liệu gốc khi ứng dụng khởi động lần đầu:
  - Chi nhánh mặc định "Trụ sở chính"
  - 5 Roles: Admin, Manager, Sales, Inventory, Technician
  - 18 Permissions theo module (USER_*, BRANCH_*, PRODUCT_*, INVENTORY_*, SALES_*, REPAIR_*)
  - Tài khoản Admin (username: `admin`, password: `Admin@123`)
  - Gán Role Admin + toàn bộ Permission cho tài khoản admin
- [x] **AuthController**: 3 endpoints - POST /api/Auth/login, POST /api/Auth/refresh-token, POST /api/Auth/logout
- [x] **Swagger với JWT**: Nút "Authorize" trên Swagger UI, tương thích Swashbuckle 10.2.3 + OpenApi v2.
- [x] **Migration `AddAuthEnterpriseFlow`**: Đã chạy thành công. RefreshToken, LoginHistory, AuditLog giờ kế thừa BaseEntity.
- [x] **BUILD SUCCEEDED - 0 Errors** ✅

**KIẾN TRÚC AUTH HIỆN TẠI:**
```
POST /api/Auth/login
  → LoginCommandValidator (FluentValidation)
  → LoginCommandHandler:
      IRepository<UserEntity> → tìm user
      IPasswordHasher.Verify() → so sánh BCrypt
      IAuthService.GetUserRoles/Permissions() → JOIN UserRole+Role+Permission
      IJwtProvider.GenerateToken() → sinh JWT 60 phút
      IJwtProvider.GenerateRefreshToken() → sinh random token
      IAuthService.SaveRefreshToken() → lưu DB (hết hạn 7 ngày)
      IAuthService.LogLoginAttempt() → ghi LoginHistory
  → AuthResponseDto { accessToken, refreshToken, expiresIn=3600, roles, permissions, user }

POST /api/Auth/refresh-token (Token Rotation)
  → IAuthService.ValidateRefreshToken() → kiểm tra DB
  → IAuthService.RevokeRefreshToken() → vô hiệu hóa token cũ
  → Sinh cặp token MỚI hoàn toàn
  → IAuthService.SaveRefreshToken() → lưu token mới

POST /api/Auth/logout [Authorize]
  → IAuthService.RevokeRefreshToken() → đánh dấu Revoked=true
```

**FILE TEST**: `PSP.API/test-foundation.http` - 8 kịch bản xuyên suốt (login → gọi API → refresh → logout → error cases)

### ✅ Phase 12: Phân hệ Hàng hóa (Goods Catalog) - Module 3, 4 & 5 (16/07/2026)
- [x] **Module 3: Category + Brand**:
  - Triển khai đầy đủ CRUD, Handlers, Queries, DTOs, Validators và Controller cho `BrandEntity` và `CategoryEntity`.
  - Cấu hình Fluent API trong `ProductConfiguration.cs` (chặn xóa danh mục nếu còn danh mục con hoặc sản phẩm).
  - Viết hệ thống comment cực kỳ chi tiết bằng tiếng Việt giúp junior/sub-junior dễ dàng đọc hiểu.
  - Áp dụng migration `UpdateGoodsCatalog` thành công.
- [x] **Module 4: Supplier (Nhà cung cấp)**:
  - Triển khai `SupplierConfiguration.cs` thiết lập ràng buộc mã (Code) tối đa 30 ký tự, độc nhất (Unique index), và tên (Name) tối đa 150 ký tự.
  - Viết đầy đủ bộ CQRS Commands/Queries, Handlers, DTOs, Validators, và API Controller (`SupplierController`) cho `SupplierEntity`.
  - Bổ sung kiểm tra logic trước khi xóa: Không cho phép xóa nhà cung cấp nếu có phiếu nhập hàng (`PurchaseOrder`) liên kết để bảo toàn dữ liệu.
  - Chạy migration `UpdateSupplierConfiguration` và cập nhật dữ liệu thành công.
- [x] **Module 5: Product + ProductVariant (Dòng sản phẩm & Biến thể)**:
  - Triển khai `ProductConfiguration` và `ProductVariantConfiguration` định nghĩa các ràng buộc về thuộc tính (Code max 50, Sku max 50, Name max 150/255, các trường CostPrice/SalePrice dạng decimal 18,2).
  - Thiết lập Unique Index cho Code và SKU để chống trùng lặp dòng sản phẩm và biến thể.
  - Xây dựng đầy đủ CQRS Commands/Queries, Handlers, DTOs, Validators và API Controller (`ProductController`) hỗ trợ cả Product và ProductVariant.
  - Áp dụng các ràng buộc nghiệp vụ xóa an toàn:
    * Chặn xóa dòng sản phẩm cha nếu vẫn còn các biến thể con đang hoạt động.
    * Chặn xóa biến thể sản phẩm nếu vẫn còn tồn kho vật lý tại bất kỳ chi nhánh nào, hoặc còn mã định danh IMEI liên kết, hoặc đã có lịch sử chứng từ phiếu nhập hàng.
  - Áp dụng di trú dữ liệu `AddProductAndVariantConfigurations` thành công.
  - Bổ sung hệ thống comment trực quan, tường tận cho người mới bắt đầu (dưới junior).
  - Tích hợp 10 kịch bản test tự động Postman.
- [x] **BUILD SUCCEEDED - 0 Errors, 0 Warnings** ✅

### ✅ Phase 13: Phân hệ Kho vận (Inventory Management) - Module 6, 7, 8, 9 & 10 (16/07/2026)
- [x] **Module 6: Warehouse (Kho hàng)**: 
  - Định nghĩa Fluent API `WarehouseConfiguration` thiết lập ràng buộc mã (`Code` max 30, unique index, và `Name` max 100).
  - Triển khai di trú dữ liệu `AddWarehouseConfiguration` và đồng bộ SQL Server thành công.
  - Viết đầy đủ CQRS Commands/Queries, Handlers, DTOs, Validators và API Controller (`WarehouseController`).
  - Áp dụng các ràng buộc nghiệp vụ xóa an toàn (Soft Delete): Chặn xóa kho nếu còn tồn kho vật lý (`Quantity > 0`), còn thiết bị IMEI liên kết, hoặc đã phát sinh chứng từ phiếu nhập, phiếu chuyển kho hay kiểm kê.
  - Phủ đầy đủ hệ thống comment trực quan, dễ hiểu bằng tiếng Việt cho người dưới junior.
  - Tích hợp 11 kịch bản test tự động Postman.
- [x] **Module 7: PurchaseOrder (Phiếu nhập kho)**:
  - Cấu hình Fluent API `PurchaseOrderConfiguration` thiết lập giới hạn `Code` (max 50, unique index) và cơ chế xóa ngoại khóa `DeleteBehavior.Restrict` đối với Supplier và Warehouse.
  - Cải tiến kiến trúc thực thể: Cho phép `InventoryEntity`, `PurchaseOrderItemEntity`, `WarehouseTransferItemEntity`, và `StockTakeItemEntity` kế thừa từ `BaseEntity` để tự động hóa auditing, soft delete và tối ưu hóa khả năng truy vấn độc lập thông qua `IRepository`.
  - Triển khai di trú DB `UpdateItemsToInheritBaseEntity` và cập nhật SQL Server thành công.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, Validators, DTOs và API Controller (`PurchaseOrderController`).
  - Triển khai nghiệp vụ nhập kho chặt chẽ:
    - Khi hoàn tất phiếu nhập (Received): Tự động cộng số lượng vào tồn kho khả dụng (`InventoryEntity`).
    - Nếu mặt hàng thuộc danh mục Điện thoại (`MOBILE`), hệ thống tự động kiểm tra tính duy nhất của danh sách IMEI nhận vào trên toàn hệ thống và gieo mới các thực thể `ImeiEntity` với trạng thái `InStock`.
    - Ràng buộc trạng thái: Chỉ cho phép Cập nhật / Xóa mềm phiếu nhập khi ở trạng thái Nháp (`Draft`).
  - Viết đầy đủ hệ thống comment trực quan tiếng Việt cho junior/sub-junior.
- [x] **Module 8: Inventory + IMEI (Tồn kho & Định danh thiết bị)**:
  - Cải tiến kiến trúc `ImeiEntity` để kế thừa `BaseEntity` (thay vì dùng primary key là chuỗi Imei tự nhiên, chuyển sang sử dụng Guid Id làm primary key, và cấu hình Unique Index trên cột `Imei`).
  - Triển khai di trú DB `UpdateImeiToInheritBaseEntity` và cập nhật cơ sở dữ liệu SQL Server thành công.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, Validators, DTOs và API Controller (`InventoryController`) để quản lý số dư tồn kho và thẻ IMEI.
  - Hiện thực các nghiệp vụ quan trọng:
    - Tra cứu thông tin chi tiết và lịch sử vòng đời của một mã số IMEI.
    - Cảnh báo tồn kho dưới mức tối thiểu (`IsLowStock` tự động so khớp `Quantity` <= `MinimumStock` tại từng kho hàng).
    - Cập nhật định mức tồn tối thiểu (`MinimumStock`) cho từng mặt hàng trong kho.
    - Cập nhật trạng thái vòng đời của một mã số IMEI (`InStock`, `Sold`, `Repairing`, `WarrantyHold`, `Disposed`).
  - Viết đầy đủ hệ thống comment trực quan tiếng Việt cho junior/sub-junior.
- [x] **Module 9: WarehouseTransfer (Điều chuyển kho)**:
  - Cấu hình Fluent API `WarehouseTransferConfiguration` thiết lập ràng buộc mã `Code` (max 50, unique index) và cơ chế khóa ngoại `DeleteBehavior.Restrict` đối với FromWarehouse và ToWarehouse.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, Validators, DTOs và API Controller (`WarehouseTransferController`) quản lý phiếu điều chuyển kho.
  - Hiện thực luồng trạng thái chặt chẽ:
    - **Pending (Chờ xử lý):** Kiểm tra hàng tồn ở kho nguồn trước khi lập phiếu. Cho phép cập nhật thông tin phiếu hoặc xóa mềm.
    - **InTransit (Đang vận chuyển):** Khóa chỉnh sửa, xác nhận bắt đầu chuyển hàng.
    - **Received (Đã nhận):** Đồng thời trừ tồn kho xuất ở nguồn, cộng tồn kho nhập ở đích, và cập nhật vị trí `WarehouseId` mới cho toàn bộ các mã số IMEI được chọn điều chuyển đi (BR-503, BR-505).
  - Viết đầy đủ hệ thống comment trực quan tiếng Việt cho junior/sub-junior.
- [x] **Module 10: StockTake (Kiểm kê kho)**:
  - Cấu hình Fluent API `StockTakeConfiguration` thiết lập ràng buộc mã `Code` (max 50, unique index) và cơ chế khóa ngoại `DeleteBehavior.Restrict` đối với Warehouse.
  - Xây dựng hoà  - Tích hợp 11 kịch bản test tự động Postman tại `postman/PSP_Promotion_Voucher.postman_collection.json`.

### ✅ Phase 16: Đơn hàng & Chi tiết đơn hàng (Module 13 - Phân hệ Bán hàng) - (17/07/2026)
- [x] **Module 13: SalesOrder + SalesOrderItem**:
  - Cải tiến kiến trúc thực thể `SalesOrderItemEntity` kế thừa từ `BaseEntity` để hỗ trợ auditing, soft delete và truy vấn độc lập qua `IRepository`.
  - Định nghĩa Fluent API `SalesOrderConfiguration` (Mã đơn hàng max 50 nvarchar độc nhất; trạng thái Enum chuyển sang chuỗi max 20; các trường giá trị decimal 18,2; liên kết Restrict với Customer, User, Branch, Voucher; liên kết Cascade với Items) và `SalesOrderItemConfiguration` (Số IMEI max 18 nvarchar nullable; số lượng; đơn giá & chiết khấu decimal 18,2; liên kết Restrict với ProductVariant).
  - Triển khai di trú DB `UpdateSalesOrderItemToInheritBaseEntity` và đồng bộ SQL Server thành công.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, DTOs, Validators trong thư mục `PSP.Application/Modules/Sales/` tách biệt hoàn toàn đọc và ghi.
  - Áp dụng các ràng buộc nghiệp vụ khi tạo đơn hàng (`CreateSalesOrderCommand`):
    * **BR-SALE-02**: Chốt giá bán tại thời điểm tạo đơn hàng (lưu cứng đơn giá vào chi tiết mặt hàng).
    * **BR-INV-01**: Kiểm tra tồn kho khả dụng của chi nhánh đối với hàng thường, ném `InventoryNotEnoughException` nếu thiếu.
    * **BR-INV-03 & BR-405**: Bắt buộc IMEI đối với điện thoại di động, kiểm tra IMEI phải ở trạng thái `InStock` tại đúng chi nhánh hiện tại.
    * Áp dụng mã giảm giá Voucher nếu được truyền lên (`VoucherCode`), tự động validate voucher hợp lệ (trạng thái, hạn dùng, lượt dùng, giá trị đơn tối thiểu) và tính toán giảm giá, cap tối đa bằng tổng tiền đơn hàng.
  - Hiện thực luồng cập nhật trạng thái đơn hàng (`UpdateSalesOrderStatusCommand`):
    * **Chuyển sang Completed**: Khấu trừ tồn kho vật lý (giảm 1 đối với hàng IMEI hoặc giảm theo số lượng đối với hàng thường), chuyển trạng thái IMEI sang `Sold` và xóa `WarehouseId` (rời kho), tăng `UsageCount` của Voucher và tự động đổi trạng thái Voucher sang `Used` nếu hết lượt.
    * **Chuyển sang Cancelled (Hủy đơn)**: Nếu đơn trước đó đã Completed, hoàn trả toàn bộ số lượng tồn kho vật lý về kho chính của chi nhánh, khôi phục trạng thái IMEI về `InStock` tại kho chính, hoàn lại lượt dùng Voucher (`UsageCount - 1`) và chuyển trạng thái Voucher về `Active` nếu được hồi sinh lượt dùng.
  - Thiết kế API Controller (`SalesOrderController`) đầy đủ các endpoint tạo đơn, cập nhật trạng thái, xóa đơn, và truy vấn thông tin phẳng.
  - Phủ đầy đủ hệ thống comment trực quan, dễ hiểu bằng tiếng Việt cho người dưới junior.
  - Tích hợp 10 kịch bản test tự động Postman tại `postman/PSP_Sales.postman_collection.json`.

### ✅ Phase 17: Hóa đơn & Thanh toán (Module 14 - Phân hệ Bán hàng) - (17/07/2026)
- [x] **Module 14: Invoice + Payment**:
  - Cải tiến kiến trúc thực thể: Cho phép `InvoiceItemEntity` và `PaymentEntity` kế thừa từ `BaseEntity` để tự động hóa auditing, soft delete và truy vấn độc lập thông qua `IRepository`.
  - Định nghĩa Fluent API cấu hình bảng `Invoices` (Mã nvarchar 50 độc nhất, Trạng thái Enum dạng chuỗi max 20, Amount thập phân, liên kết Restrict với SalesOrder, liên kết Cascade với Items/Payments), `InvoiceItems` (đơn giá thập phân, liên kết Restrict với ProductVariant), `PaymentMethods` (Mã Code max 30 độc nhất, tên max 100, IsActive mặc định true), và `Payments` (Mã giao dịch Code max 100 độc nhất, số tiền thập phân, trạng thái Enum dạng chuỗi max 20, liên kết Restrict với PaymentMethod).
  - Triển khai di trú DB `AddInvoiceAndPaymentConfigurations` và cập nhật SQL Server thành công.
  - Viết bộ gieo dữ liệu phương thức thanh toán gốc (`SeedPaymentMethodsAsync`) tạo sẵn hai phương thức: Tiền mặt (`CASH`) và Chuyển khoản ngân hàng (`BANK_TRANSFER`) vào Database khi ứng dụng khởi chạy lần đầu.
  - Xây dựng hoàn chỉnh cấu trúc CQRS (Commands/Queries, Handlers, DTOs, Validators) và API Controller (`InvoiceController`).
  - Lập trình logic nghiệp vụ cốt lõi:
    * **Tạo hóa đơn (`CreateInvoiceCommand`)**: Đảm bảo mỗi đơn hàng chỉ xuất tối đa 1 hóa đơn, tự động copy toàn bộ chi tiết mặt hàng và chốt tổng tiền cần thanh toán bằng đúng tổng thực thu của đơn hàng.
    * **Ghi nhận thanh toán (`CreatePaymentCommand`)**:
      * **BR-802**: Cho phép khách hàng chia nhỏ thanh toán nhiều lần trên cùng một hóa đơn (ví dụ: trả 1 phần tiền mặt, 1 phần chuyển khoản).
      * **BR-801**: Khi tổng số tiền thanh toán thành công khớp chính xác bằng tổng giá trị hóa đơn, tự động chuyển trạng thái Hóa đơn sang `Paid` và tự động kích hoạt cập nhật trạng thái đơn hàng liên kết sang `Completed` (thông qua MediatR `UpdateSalesOrderStatusCommand` để đồng bộ trừ tồn kho vật lý và cộng lượt dùng voucher).
      * **BR-803**: Khóa cứng hóa đơn. Chặn toàn bộ thao tác ghi nhận thanh toán mới hoặc hủy hóa đơn đối với hóa đơn đã trả đủ tiền (`Paid`).
    * **Hủy hóa đơn (`CancelInvoiceCommand`)**: Cho phép chuyển trạng thái hóa đơn sang `Cancelled` nếu hóa đơn chưa thanh toán.
  - Phủ đầy đủ hệ thống comment trực quan, dễ hiểu bằng tiếng Việt cho người dưới junior.
  - Tích hợp 10 kịch bản test tự động Postman tại `postman/PSP_Invoice.postman_collection.json`.

### ✅ Phase 18: Phân hệ Dịch vụ - Sửa chữa (Module 15 - Phân hệ Dịch vụ) - (18/07/2026)
- [x] **Module 15: RepairTicket + RepairPart + RepairStatusHistory**:
  - Cải tiến kiến trúc thực thể: Cho phép `RepairPartEntity` và `RepairStatusHistoryEntity` kế thừa từ `BaseEntity` để tự động hóa auditing, soft delete và sử dụng Repository Pattern thông qua `IRepository`.
  - Định nghĩa Fluent API cấu hình bảng `RepairTickets` (mã phiếu dài tối đa 50 ký tự độc nhất; trạng thái Enum được chuyển sang chuỗi tối đa 20 ký tự; mô tả lỗi tối đa 1000 ký tự; EstimatedCost, ActualCost, LaborCost dạng decimal 18,2; liên kết Restrict với Customer, ProductVariant, received/technician Users; liên kết Cascade với Parts/StatusHistories), `RepairParts` (đơn giá decimal 18,2; liên kết Restrict với RepairTicket, ProductVariant), và `RepairStatusHistories` (trạng thái tối đa 20 ký tự; ghi chú lý do tối đa 255; liên kết Restrict với RepairTicket).
  - Triển khai di trú DB `AddRepairConfigurations`, `UpdateRepairEntitiesToInheritBaseEntity` và `AddLaborCostToRepairTicket` đồng bộ thành công SQL Server.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, DTOs, Validators và Controller (`RepairTicketController`) cho phiếu sửa chữa và linh kiện dịch vụ.
  - Lập trình nghiệp vụ cốt lõi:
    * **Tạo phiếu sửa chữa (`CreateRepairTicketCommand`)**: Tiếp nhận thông tin máy lỗi, tạo mã phiếu theo chuẩn `REP-yyyyMMdd-XXXXXX`, đặt trạng thái mặc định là `Received` và tự động ghi nhận dòng lịch sử đầu tiên.
    * **Xuất linh kiện thay thế (`AddRepairPartCommand`)**: Kiểm tra tồn kho linh kiện thay thế tại các kho hàng thuộc chi nhánh tiếp nhận của nhân viên lập phiếu. Nếu đủ, thực hiện khấu trừ trừ dần hàng tồn vật lý tại các kho tương ứng.
    * **Cập nhật trạng thái sửa chữa (`UpdateRepairStatusCommand`)**:
      * **BR-SERV-01 (Luân chuyển tuyến tính)**: Chặn mọi hành động đi lùi trạng thái (ví dụ: từ `Repairing` không được quay về `Received`).
      * Ghi nhận dòng lịch sử trạng thái cho mỗi lần thay đổi để theo dõi dòng thời gian sửa chữa của thiết bị.
      * Khi chuyển sang trạng thái `Completed`: Tính toán lại tổng tiền phiếu sửa chữa: `ActualCost = LaborCost + Sum(RepairPart.UnitPrice * Quantity)`.
      * Khi chuyển sang trạng thái `Cancelled`: Tự động hoàn trả tồn kho vật lý của tất cả linh kiện đã xuất về kho dịch vụ của chi nhánh để bảo toàn hàng hóa, đồng thời soft delete các dòng linh kiện đó.
    * **Xóa phiếu sửa chữa (`DeleteRepairTicketCommand`)**: Chỉ cho phép xóa khi phiếu ở trạng thái `Received` và chưa phát sinh linh kiện thay thế.
  - Phủ đầy đủ hệ thống comment XML và inline cực kỳ chi tiết bằng tiếng Việt giúp lập trình viên dưới trình độ junior dễ dàng đọc hiểu.
  - Tích hợp các kịch bản test tự động trong bộ sưu tập hợp nhất tại `postman/PSP_Service.postman_collection.json`.

### ✅ Phase 19: Phân hệ Dịch vụ - Bảo hành (Module 16 - Phân hệ Dịch vụ) - (18/07/2026)
- [x] **Module 16: WarrantyTicket + WarrantyHistory**:
  - Cải tiến kiến trúc thực thể: Cho phép `WarrantyHistoryEntity` kế thừa từ `BaseEntity` để tự động hóa auditing, soft delete và sử dụng Repository Pattern thông qua `IRepository`.
  - Định nghĩa Fluent API cấu hình bảng `WarrantyTickets` (mã phiếu bảo hành dài tối đa 50 ký tự độc nhất; trạng thái Enum lưu dạng chuỗi tối đa 20 ký tự; số IMEI tối đa 18 ký tự; mô tả note tối đa 1000 ký tự; liên kết Restrict với Customer, SalesOrder, ProductVariant; liên kết Cascade với Histories) và `WarrantyHistories` (hành động tối đa 100 ký tự; trạng thái tối đa 20 ký tự; mô tả chi tiết tối đa 500 ký tự; liên kết Restrict với WarrantyTicket).
  - Triển khai di trú DB `AddWarrantyConfigurations` và cập nhật SQL Server thành công.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, DTOs, Validators và Controller (`WarrantyTicketController`) cho phiếu bảo hành và lịch sử xử lý bảo hành.
  - Lập trình nghiệp vụ cốt lõi:
    * **Tra cứu bảo hành (`CheckWarrantyStatusQuery`)**: Hỗ trợ kỹ thuật viên tra cứu nhanh trạng thái IMEI thiết bị. Xác thực thiết bị đã được bán thành công thông qua đơn bán hàng lẻ hoàn thành (BR-901) và thời gian mua hàng nằm trong thời hạn 12 tháng kể từ ngày bán (BR-902).
    * **Tạo phiếu bảo hành (`CreateWarrantyTicketCommand`)**: Lập phiếu tiếp nhận bảo hành máy lỗi dạng `WAR-yyyyMMdd-XXXXXX`, đổi trạng thái IMEI sang `WarrantyHold` để tạm khóa thiết bị trong kho hệ thống, và tự động ghi nhận dòng lịch sử ban đầu.
    * **Cập nhật trạng thái bảo hành (`UpdateWarrantyStatusCommand`)**:
      * **BR-905 (Đổi máy mới)**: Nếu máy lỗi hỏng nặng không thể sửa, kỹ thuật viên truyền IMEI thay thế mới có sẵn trong kho (`InStock`). Hệ thống tự động chuyển IMEI cũ sang trạng thái hủy sử dụng `Disposed`, chuyển IMEI mới sang trạng thái đã bán `Sold` và rút khỏi kho vật lý, đồng thời cập nhật IMEI trên phiếu và lịch sử bảo hành.
      * Khi kết thúc bảo hành (`Completed`, `Rejected` hoặc `Cancelled`): Cập nhật ngày kết thúc `EndDate` và tự động trả trạng thái của IMEI hiện hành về lại trạng thái đã bán `Sold`.
    * **Xóa phiếu bảo hành (`DeleteWarrantyTicketCommand`)**: Chỉ cho phép xóa khi phiếu ở trạng thái tiếp nhận `Received` và tự động trả lại trạng thái IMEI về `Sold`.
  - Phủ đầy đủ hệ thống comment XML và inline cực kỳ chi tiết bằng tiếng Việt giúp lập trình viên dưới trình độ junior dễ dàng đọc hiểu.
  - Tích hợp các kịch bản test tự động trong bộ sưu tập hợp nhất tại `postman/PSP_Service.postman_collection.json`.

---

## 5. HƯỚNG DẪN CHI TIẾT CÁC BƯỚC TIẾP THEO (DEVELOPER GUIDE)

Dưới đây là kế hoạch chi tiết thiết kế và quy trình phát triển cho **Phân hệ Dịch vụ - Phiếu sửa chữa (Service Subsystem - Module 15)**:

### 🔜 Phân hệ Dịch vụ (Module 15)
Phân hệ này quản lý toàn bộ quy trình sửa chữa thiết bị của khách hàng tại chi nhánh, bao gồm tiếp nhận máy lỗi, theo dõi lịch sử trạng thái sửa chữa, xuất linh kiện thay thế và tính toán chi phí dịch vụ.

#### 1. Các thực thể nghiệp vụ liên quan:
1. **RepairTicket (Phiếu sửa chữa)**: `CustomerId`, `BranchId`, `DeviceName`, `DeviceSerialOrImei`, `ProblemDescription`, `Status` [Received, Diagnosing, WaitingForParts, Repairing, Completed, Cancelled, Returned], `LaborCost` (Tiền công thợ), `TotalAmount` (Tiền công + Tiền linh kiện).
2. **RepairPart (Linh kiện thay thế)**: `RepairTicketId`, `ProductVariantId` (Linh kiện lấy từ danh mục sản phẩm), `Quantity`, `UnitPrice`.
3. **RepairStatusHistory (Lịch sử trạng thái)**: `RepairTicketId`, `Status` (Trạng thái chuyển dịch), `Note`, `ChangedByUserId`, `ChangedAt`.

#### 2. Nghiệp vụ cốt lõi cần lập trình trong Handler:
1. **Tiếp nhận thiết bị (CreateRepairTicketCommand)**:
   * Ghi nhận thông tin thiết bị lỗi, người đại diện sửa chữa, chi nhánh tiếp nhận.
   * Mặc định phiếu ở trạng thái `Received`.
2. **Xuất linh kiện thay thế (AddRepairPartCommand)**:
   * Thợ sửa chữa yêu cầu xuất linh kiện từ kho hàng của chi nhánh để lắp ráp/thay thế.
   * Hệ thống phải kiểm tra tồn kho của linh kiện đó trong kho hàng. Nếu đủ, trừ tồn kho vật lý tương ứng.
3. **Cập nhật trạng thái phiếu sửa chữa (UpdateRepairStatusCommand)**:
   * **BR-SERV-01 (Chuyển dịch trạng thái tuyến tính)**: Trạng thái chỉ đi lên, không được phép quay ngược về trạng thái trước đó (ví dụ: đang `Repairing` không được chuyển về `Received`).
   * Ghi nhận dòng lịch sử trạng thái vào bảng `RepairStatusHistory` cho mỗi lần chuyển dịch để theo dõi dòng thời gian sửa chữa của máy.
   * Khi chuyển sang trạng thái `Completed`: Tính toán lại tổng tiền `TotalAmount = LaborCost + Sum(RepairPart.UnitPrice * Quantity)`.

#### 3. Quy trình triển khai:
1. **Bước 1: Cấu hình Fluent API** cho `RepairTicket`, `RepairPart`, và `RepairStatusHistory` trong `PSP.Infrastructure/Data/Configurations/`.
2. **Bước 2: Tạo Migration** và cập nhật Database.
3. **Bước 3: Viết CQRS (Commands/Queries, Handlers, DTOs, Validators)** trong `PSP.Application/Modules/Service/` (hoặc `PSP.Application/Modules/Repair/`). Viết comment tiếng Việt chi tiết cho người dưới junior.
4. **Bước 4: Tạo API Controller** (`RepairController` hoặc `RepairTicketController`).
5. **Bước 5: Viết kịch bản Test tự động (Postman)** vào file `postman/PSP_Repair.postman_collection.json`.

---

## 6. LỊCH SỬ PHÁT TRIỂN & PHIÊN BẢN CỤ THỂ (DETAILED UPDATE LOG)

### 📅 Cập nhật ngày 15/07/2026:
* **Cấu hình Swagger Grouping & Naming (Tinh gọn)**:
  - Đã làm sạch các Swagger tag nhóm APIs:
    * `AuthController` ➔ `Authorization`
    * `BranchController` ➔ `Branches`
    * `UserController` ➔ `Users`
  - Đã đưa Swagger Title về: `Phone Service Platform API` với mô tả tinh gọn theo yêu cầu.
* **Bộ dữ liệu Postman Collection đầy đủ kịch bản (`postman/PSP_Foundation.postman_collection.json`)**:
  - Viết đầy đủ 28 test cases tự động (Auth: 8, Branches: 10, Users: 10) hỗ trợ tự trích xuất, lưu trữ và xoay vòng token khi test tự động.
* **Build status**: `SUCCESS` (0 Errors, 0 Warnings).

---

## 7. QUY TẮC BÁO CÁO VÀ PHÁT TRIỂN CHO AI (AI DEVELOPMENT & REPORTING GUIDELINES)

Để đảm bảo tính nhất quán và chất lượng sản phẩm qua các phiên làm việc (sessions) khác nhau, tất cả các AI khi tiếp nhận phát triển bất kỳ module nào tiếp theo PHẢI tuân thủ nghiêm ngặt quy trình và định dạng báo cáo sau:

### ⚠️ ƯU TIÊN SỐ MỘT (CRITICAL PRIORITY #1):
* **BẮT BUỘC: Viết comment cho người chưa và mới học, trình độ dưới junior có thể đọc và hiểu chi tiết.** 
  Mỗi lần nhận yêu cầu phát triển, hoàn thiện một module mới hoặc sửa đổi code cũ, AI phải viết hệ thống comment XML và inline cực kỳ chi tiết bằng tiếng Việt. Giải thích tường tận mục đích của lớp, ý nghĩa các tham số, lý do sử dụng các công nghệ (như MediatR, Mapster, FluentValidation, EF Core, Unit of Work) và giải thích từng bước logic nghiệp vụ để bất kỳ lập trình viên nào ở trình độ mới học hoặc dưới junior đều có thể đọc, hiểu chi tiết và giải thích được code dễ dàng.

### 1. Định dạng báo cáo kết quả công việc bắt buộc:
Mỗi khi hoàn thành một module, AI phải trình bày kết quả bao gồm đầy đủ các mục lớn sau:
* **`### 📂 Danh sách các file liên quan`**: Liệt kê chi tiết tất cả các file đã được tạo mới hoặc chỉnh sửa (phân chia rõ theo các tầng Domain, Application, Infrastructure, API). Mỗi file phải đi kèm với một link markdown dạng `file://` chuẩn chỉnh (ví dụ: `[filename](file:///D:/path/to/file)`) sử dụng dấu gạch chéo xuôi `/` cho cả môi trường Windows.
* **`#### 5. Bộ kịch bản Test tự động (Postman)`**: Bắt buộc phải viết/cập nhật kịch bản test tự động trong thư mục `postman`. Báo cáo phải tóm tắt rõ các test case được thiết lập (bao gồm các test case Happy Path và Error Path, cơ chế tự động lưu token và kiểm tra status code).
* **`#### 6. Nhật ký lưu trữ`**: Ghi nhận tiến độ công việc trực tiếp vào mục `## 4. TIẾN ĐỘ THỰC HIỆN TÁC VỤ (TASK LOG)` trong file `project_memory_log.md` này bằng cách thêm các Phase mới hoặc đánh dấu hoàn thành mà KHÔNG được xóa đi hay làm hỏng lịch sử của các Phase đã hoàn thành trước đó.
* **`### 🔍 Kết quả kiểm tra`**: Cung cấp bằng chứng biên dịch thành công (kết quả chạy lệnh `dotnet build` với 0 Errors và 0 Warnings) và kết quả chạy thử (nếu có).

### 2. Quy chuẩn viết code và kiểm tra ràng buộc:
* Thực hiện viết comment chi tiết đáp ứng đúng **Ưu tiên số một** nêu trên cho toàn bộ các file.
* Áp dụng chặt chẽ các ràng buộc nghiệp vụ xóa an toàn (Soft Delete), luôn kiểm tra sự tồn tại của dữ liệu liên quan ở các bảng khác trước khi thực hiện xóa mềm để bảo toàn dữ liệu hệ thống.



