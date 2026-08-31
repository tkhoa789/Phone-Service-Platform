# NHẬT KÝ KÝ ỨC DỰ ÁN (PROJECT MEMORY LOG)
## PHONE SERVICE PLATFORM (PSP) - ENTERPRISE REPAIR & RETAIL MANAGEMENT SYSTEM

**Cập nhật lần cuối:** 21/07/2026 01:21 PM

---

## 1. THÔNG TIN CHUNG DỰ ÁN

* **Tên chính thức**: Phone Service Platform (PSP)
* **Tên thương mại**: Enterprise Phone Repair & Retail Management System
* **Thư mục dự án**: `D:\Phone-Service-Platform`
* **Thư mục tài liệu**: `D:\Tai Lieu DACN`
* **Vai trò của AI (Antigravity)**: PM & Architecture Advisor. Không viết Code trực tiếp - tập trung Review, Architecture, Business Rule, Naming, Performance, Security, Prompt, Test Cases.
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
| AI | Ollama + Qwen 2.5:7b + Qdrant + RAG | ✅ Đang chạy (Ollama Local, Qdrant Docker Port 6333) |
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
| 21/07 13:28 | Thiết lập môi trường AI (Cài đặt Docker Desktop, Ollama, tải model `qwen2.5:7b` nhờ cấu hình RTX 3070 Ti 8GB) | ✅ Hoàn thành |
| 21/07 14:22 | Khắc phục lỗi WSL & Khởi động Docker Desktop thành công | ✅ Hoàn thành |
| 21/07 14:55 | Khởi chạy cơ sở dữ liệu Vector Qdrant trên Docker | ✅ Hoàn thành |

### 📝 Chi tiết nhật ký cài đặt môi trường AI (Module 20):
* **21/07 13:28**: Lập kế hoạch thiết lập môi trường AI. Do cấu hình phần cứng của USER rất mạnh (CPU i7-12700KF, 32GB RAM DDR5, GPU RTX 3070 Ti 8GB VRAM), quyết định đổi đích tải mô hình từ bản `qwen2.5:3b` lên bản thông minh hơn **`qwen2.5:7b`** để chạy mượt mà 100% trên GPU.
* **21/07 13:36**: Hướng dẫn USER cấu hình các tùy chọn cài đặt Docker Desktop: chọn `Per-user installation`, tích `Use WSL 2` (tăng hiệu suất, giảm tiêu thụ RAM), không chọn `Allow Windows Containers` (vì Qdrant là Linux Container), và tạo shortcut desktop.
* **21/07 13:40**: USER hoàn thành cài đặt Docker Desktop và Ollama Desktop.
* **21/07 13:42**: USER thực hiện câu lệnh kéo model nhưng bị lỗi cú pháp `ollama pull qwen2.5.7b` (gõ nhầm dấu chấm thay vì dấu hai chấm). AI hướng dẫn sửa lại cú pháp chuẩn: `ollama pull qwen2.5:7b`. USER đang tiến hành tải mô hình.
* **21/07 13:49**: USER yêu cầu AI hỗ trợ kéo và chạy dịch vụ Vector DB Qdrant.
* **21/07 13:50**: AI chạy lệnh kiểm tra `docker ps` nhưng gặp lỗi do session terminal chưa cập nhật biến môi trường `PATH` mới sau khi cài Docker. AI đã thực hiện lệnh làm mới biến `PATH` tạm thời trong phiên chạy hiện tại thông qua PowerShell `[System.Environment]::GetEnvironmentVariable`. Kết quả kiểm tra thành công, xác nhận phiên bản Docker `29.6.2`.
* **21/07 13:51**: AI tiến hành khởi chạy container Qdrant thông qua lệnh `docker run -d -p 6333:6333 -p 6334:6334 qdrant/qdrant` và đẩy tiến trình vào nền. Tuy nhiên lệnh báo lỗi `500 Internal Server Error` do Docker Desktop mới cài đặt chưa được mở giao diện để chấp nhận điều khoản dịch vụ (License Agreement) và kích hoạt WSL 2 Linux Engine. AI đã hướng dẫn USER mở Docker Desktop thủ công để hoàn tất thiết lập ban đầu.
* **21/07 13:56**: USER báo cáo Docker Desktop báo lỗi khởi động (failed to start) và hiển thị trạng thái "Engine stopped" dù vừa cài đặt xong. AI thực hiện kiểm tra tình trạng ảo hóa hệ thống thông qua PowerShell command:
  `Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux`
  Kết quả trả về cho thấy tính năng Windows Subsystem for Linux (WSL) đang ở trạng thái **Disabled** (Bị tắt), làm Docker không khởi động được Linux VM engine.
* **21/07 13:57**: Để khắc phục triệt để, AI đã kích hoạt trực tiếp các tính năng ảo hóa cần thiết cho Docker trên Windows bằng cách chạy các lệnh PowerShell dưới phiên quyền Administrator (Administrator Session) như sau:
  1. Bật tính năng WSL: `Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart`
  2. Bật tính năng Virtual Machine Platform: `Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart`
  Cả hai lệnh đều chạy thành công và trả về `RestartNeeded : True` (Yêu cầu khởi động lại). AI hướng dẫn USER khởi động lại (reboot) máy tính để Windows nạp cấu hình mới.
* **21/07 14:22 (Phiên hiện tại)**: Sau khi USER khởi động lại máy, gặp các lỗi ngăn Docker Desktop hoạt động và đã được khắc phục như sau:
  - **Lỗi 1 (Thiếu Kernel WSL 2)**: Lệnh `docker info` lỗi báo WSL 2 Kernel file not found.
    * *Khắc phục*: Tải file `wsl_update_x64.msi` từ Microsoft và cài đặt thành công (`msiexec /i wsl_update_x64.msi /quiet /norestart`).
  - **Lỗi 2 (WSL cũ)**: Docker Desktop báo lỗi "Your version of WSL is too old".
    * *Khắc phục*: Tải bản cài đặt WSL MSI mới nhất `wsl.2.7.10.0.x64.msi` (246MB) từ GitHub Releases của Microsoft và cài đặt thành công. Nâng cấp WSL lên Kernel v6.18.33.2.
  - **Lỗi 3 (Thiếu Distro & Lỗi Store 0x80073cf9 / 0x80070002)**: Lệnh `wsl -l -v` báo không có distro nào, Docker Desktop không tự đăng ký được distro `docker-desktop`. Lập lệnh `wsl --install -d Ubuntu` hoặc `Add-AppxPackage` offline bị lỗi deploy `0x80073cf9`.
    * *Khắc phục*: Tải gói cài đặt Ubuntu `ubuntu2204.AppxBundle` trực tiếp. Đổi đuôi sang `.zip`, giải nén lấy file `.appx`, tiếp tục giải nén file `.appx` lấy file `install.tar.gz` chứa rootfs của Ubuntu.
    * Thực hiện import thủ công: `wsl --import Ubuntu C:\WSL\Ubuntu $env:TEMP\ubuntu_x64_extracted\install.tar.gz --version 2`. Tạo thư mục `C:\Windows\AUInstallAgent` để vá lỗi deployment.
  - **Khởi động thành công**: Thực hiện lệnh `wsl --shutdown` để nạp cấu hình mới. Chạy lại Docker Desktop. Ứng dụng đã tự động đăng ký distro `docker-desktop`, format ổ đĩa ảo và khởi chạy thành công. Lệnh `docker info` phản hồi chuẩn xác (Docker Engine 29.6.2, cgroupv2, 20 CPUs, 15.5GB RAM).

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
- [x] **LoginCommandHandler** (7 bước): Tìm user → Kiểm tra Status → BCrypt verify → Lấy Role/Permission → Sinh JWT+RefreshToken → Lưu RefreshToken DB → Ghi LoginHistory.
- [x] **LogoutCommandHandler**: Thu hồi RefreshToken (Revoke) trong DB khi đăng xuất.
- [x] **RefreshTokenCommandHandler**: Token Rotation pattern - thu hồi Token cũ, cấp cặp Token mới hoàn toàn.
- [x] **DatabaseSeeder**: Tự động tạo dữ liệu gốc khi ứng dụng khởi động lần đầu:
  - Chi nhánh mặc định "Trụ sở chính"
  - 5 Roles: Admin, Manager, Sales, Inventory, Technician
  - 18 Permissions theo Module (USER_*, BRANCH_*, PRODUCT_*, INVENTORY_*, SALES_*, REPAIR_*)
  - Tài khoản Admin (Username: `admin`, Password: `Admin@123`)
  - Gán Role Admin + toàn bộ Permission cho tài khoản admin
- [x] **AuthController**: 3 endpoints - POST /api/Auth/login, POST /api/Auth/refresh-Token, POST /api/Auth/logout
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
      IJwtProvider.GenerateRefreshToken() → sinh random Token
      IAuthService.SaveRefreshToken() → lưu DB (hết hạn 7 ngày)
      IAuthService.LogLoginAttempt() → ghi LoginHistory
  → AuthResponseDto { accessToken, refreshToken, expiresIn=3600, Roles, Permissions, user }

POST /api/Auth/refresh-Token (Token Rotation)
  → IAuthService.ValidateRefreshToken() → kiểm tra DB
  → IAuthService.RevokeRefreshToken() → vô hiệu hóa Token cũ
  → Sinh cặp Token MỚI hoàn toàn
  → IAuthService.SaveRefreshToken() → lưu Token mới

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
  - Định nghĩa Fluent API cấu hình bảng `WarrantyTickets` (mã phiếu bảo hành dài tối đa 50 ký tự độc nhất; trạng thái Enum lưu dạng chuỗi tối đa 20 ký tự; số IMEI tối đa 18 ký tự; mô tả Note tối đa 1000 ký tự; liên kết Restrict với Customer, SalesOrder, ProductVariant; liên kết Cascade với Histories) và `WarrantyHistories` (hành động tối đa 100 ký tự; trạng thái tối đa 20 ký tự; mô tả chi tiết tối đa 500 ký tự; liên kết Restrict với WarrantyTicket).
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

### ✅ Phase 20: Phân hệ Hỗ trợ - Module 17: Notification & FileAttachment (21/07/2026)
- [x] **FileAttachment (Tệp đính kèm)**:
  - Cho phép `FileAttachmentEntity` kế thừa từ `BaseEntity` để tự động hóa auditing, soft delete và sử dụng Repository Pattern thông qua `IRepository`.
  - Triển khai interface `IFileStorageService` và lớp cài đặt cụ thể `LocalFileStorageService` để lưu trữ tệp tin tải lên trực tiếp vào thư mục `wwwroot/uploads` của API.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, DTOs, Validators và Controller `FileAttachmentController` (hỗ trợ `multipart/form-data` và `IFormFile`).
- [x] **Notification (Thông báo hệ thống)**:
  - Cho phép `NotificationEntity` kế thừa từ `BaseEntity` để tự động hóa auditing, soft delete.
  - Triển khai `NotificationHub` (SignalR) ở tầng Infrastructure và dịch vụ `NotificationService` giúp gửi thông báo thời gian thực đến client đồng thời lưu xuống DB.
  - Cập nhật cấu hình JWT trong `Program.cs` hỗ trợ tự động giải nén JWT Token từ Query String cho các kết nối WebSockets đến `/notificationHub`.
  - Xây dựng hoàn chỉnh CQRS Commands/Queries, Handlers, DTOs, Validators và Controller `NotificationController`.
- [x] Triển khai migration `UpdateNotificationBaseEntities` thành công và đồng bộ SQL Server.
- [x] Thiết lập tệp client mẫu `test-notification.html` trên Desktop để thử nghiệm kết nối WebSocket thời gian thực.
- [x] Tích hợp kịch bản test tự động Postman tại `postman/PSP_07_Support.postman_collection.json`.
- [x] **BUILD SUCCEEDED - 0 Errors, 0 Warnings** ✅

### ✅ Phase 21: Phân hệ Hỗ trợ - Module 18: AuditLog (21/07/2026)
- [x] **AuditLog (Nhật ký thao tác tự động)**:
  - Triển khai lớp phụ trợ `AuditEntry.cs` ở tầng Infrastructure để tạm gom nhóm dữ liệu thay đổi của các thực thể trước khi ghi log.
  - Override hàm `SaveChangesAsync` trong `AppDbContext.cs` để tự động kích hoạt ghi log thao tác dữ liệu:
    * **CREATE**: Tự động chụp lại và chuyển thành JSON toàn bộ giá trị mới (`NewValue`).
    * **UPDATE**: So sánh sự thay đổi của từng thuộc tính, ghi nhận giá trị cũ (`OldValue`) và giá trị mới (`NewValue`).
    * **DELETE (Soft Delete)**: Phát hiện cờ `IsDeleted` đổi từ `false` sang `true` và chuyển dịch loại hành động thành `DELETE`.
    * Tự động bỏ qua các trường hệ thống để log được tinh gọn và sạch sẽ.
    * Gán mặc định `UserId` là Admin `20000000-0000-0000-0000-000000000001` (System) nếu không tìm thấy thông tin đăng nhập trong phiên làm việc.
  - Xây dựng hoàn chỉnh CQRS Queries, Handlers, DTOs (`AuditLogDto`) và Controller `AuditLogController` phục vụ việc truy vấn log có phân trang và lọc theo điều kiện.
  - Áp dụng phân quyền chặt chẽ: Chỉ cho phép các tài khoản có vai trò `Admin` hoặc `Manager` gọi API lấy danh sách log.
  - Tích hợp kịch bản test tự động Postman tại `postman/PSP_08_AuditLog.postman_collection.json`.
  - **BUILD SUCCEEDED - 0 Errors, 0 Warnings** ✅

### ✅ Phase 22: Phân hệ Hỗ trợ - Module 19: Report & Dashboard (21/07/2026)
- [x] **Report & Dashboard**:
  - Xây dựng cấu trúc DTOs (`ManagerDashboardDto`, `BranchRevenueDto`, `DailyRevenueDto`, `TopProductDto`, `DeadStockDto`) phản ánh các dữ liệu doanh thu, lợi nhuận, ca sửa chữa/bảo hành đang mở và cảnh báo hàng đọng kho.
  - Triển khai CQRS Query `GetManagerDashboardQuery` và Handler `DashboardQueryHandlers` thực hiện:
    * Kiểm tra vai trò Admin/Manager và áp dụng phân quyền hiển thị theo chi nhánh (BR-1201).
    * Tính toán doanh thu từ các hóa đơn đã thanh toán (BR-1202).
    * Tính toán lợi nhuận dựa trên giá bán và giá vốn (BR-1203).
    * Phân tích hàng đọng kho (Dead Stock) dựa trên tồn kho vật lý và thời gian chưa bán được >= 30 ngày.
  - Xây dựng `DashboardController` cung cấp API an toàn thông qua bộ lọc quyền hạn `[Authorize(Roles = "Admin,Manager")]`.
  - Triển khai dịch vụ chạy nền `AIInsightsWorker` (Hosted Service) tự động quét hàng tồn kho thấp và đẩy thông báo/cảnh báo qua SignalR.
  - Tạo dịch vụ khởi chạy `StoreAssistant` (nền tảng) cung cấp cơ chế đề xuất giải pháp xử lý hàng tồn kho, sẵn sàng tích hợp AI Semantic Kernel ở Module 20.
  - Đăng ký toàn bộ dịch vụ trong hệ thống Dependency Injection của `PSP.Infrastructure`.
  - Tích hợp bộ kịch bản test tự động Postman tại [PSP_09_Dashboard.postman_collection.json](file:///D:/Phone-Service-Platform/postman/PSP_09_Dashboard.postman_collection.json).
  - **BUILD SUCCEEDED - 0 Errors, 0 Warnings** ✅

### ✅ Phase 23: Phân hệ AI & RAG - Module 20: AI Service & Assistant (21/07/2026)
- [x] **AI & RAG Integration**:
  - [x] Cài đặt các gói NuGet Semantic Kernel, Ollama và Qdrant connectors cho project `PSP.Infrastructure`.
  - [x] Cấu hình địa chỉ endpoint Ollama, model `qwen2.5:7b` và model embedding `nomic-embed-text` trong `appsettings.json`.
  - [x] Tải thành công model embedding `nomic-embed-text` trong Ollama cục bộ.
  - [x] Đăng ký `QdrantClient` và `Kernel` trong Dependency Injection (`DependencyInjection.cs`).
  - [x] Hoàn thiện lớp `StoreAssistant.cs` hỗ trợ gọi LLM, nhúng vector, tự động tạo collection Qdrant, nạp tri thức (ingest) và tìm kiếm vector tương đồng (RAG).
  - [x] Bổ sung tài liệu hướng dẫn chi tiết dành cho người mới bắt đầu: [module20_ai_rag_guide.md](file:///D:/Tai%20Lieu%20DACN/Antigravity%20Memory%20Log/module20_ai_rag_guide.md).
  - [x] Thiết lập các interface abstraction `IAppDbContext` và `IStoreAssistant` trong `PSP.Application` tuân thủ nguyên tắc Clean Architecture.
  - [x] Cài đặt gói `Microsoft.EntityFrameworkCore` cho project `PSP.Application`.
  - [x] Triển khai toàn bộ cấu trúc CQRS MediatR gồm các DTOs, Validators, Commands và Queries (SendAIMessage, IngestKnowledgeDocument, GetConversations, GetConversationDetail) kèm theo comment XML/inline cực kỳ chi tiết bằng tiếng Việt cho người mới học.
  - [x] Xây dựng `AIController` phơi các API Chat, Ingest và Lịch sử hội thoại, bảo vệ API bằng thuộc tính `[Authorize]` và phân quyền Admin/Manager khi nạp tài liệu.
  - [x] Viết kịch bản kiểm thử tự động kết nối đầu-cuối bằng PowerShell (Login -> Ingest chính sách bảo hành -> Chat RAG hỏi đáp -> Kiểm tra ghi nhận DB -> Lấy lịch sử chat) thành công mỹ mãn.
  - [x] **BUILD SUCCEEDED - 0 Errors, 0 Warnings** ✅

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
  - Viết đầy đủ 28 test cases tự động (Auth: 8, Branches: 10, Users: 10) hỗ trợ tự trích xuất, lưu trữ và xoay vòng Token khi test tự động.
* **Build Status**: `SUCCESS` (0 Errors, 0 Warnings).

---

## 7. QUY TẮC BÁO CÁO VÀ PHÁT TRIỂN CHO AI (AI DEVELOPMENT & REPORTING GUIDELINES)

Để đảm bảo tính nhất quán và chất lượng sản phẩm qua các phiên làm việc (sessions) khác nhau, tất cả các AI khi tiếp nhận phát triển bất kỳ Module nào tiếp theo PHẢI tuân thủ nghiêm ngặt quy trình và định dạng báo cáo sau:

### ⚠️ ƯU TIÊN SỐ MỘT (CRITICAL PRIORITY #1):
* **BẮT BUỘC: Viết comment cho người chưa và mới học, trình độ dưới junior có thể đọc và hiểu chi tiết.** 
  Mỗi lần nhận yêu cầu phát triển, hoàn thiện một Module mới hoặc sửa đổi Code cũ, AI phải viết hệ thống comment XML và inline cực kỳ chi tiết bằng tiếng Việt. Giải thích tường tận mục đích của lớp, ý nghĩa các tham số, lý do sử dụng các công nghệ (như MediatR, Mapster, FluentValidation, EF Core, Unit of Work) và giải thích từng bước logic nghiệp vụ để bất kỳ lập trình viên nào ở trình độ mới học hoặc dưới junior đều có thể đọc, hiểu chi tiết và giải thích được Code dễ dàng.

### 1. Định dạng báo cáo kết quả công việc bắt buộc:
Mỗi khi hoàn thành một Module, AI phải trình bày kết quả bao gồm đầy đủ các mục lớn sau:
* **`### 📂 Danh sách các file liên quan`**: Liệt kê chi tiết tất cả các file đã được tạo mới hoặc chỉnh sửa (phân chia rõ theo các tầng Domain, Application, Infrastructure, API). Mỗi file phải đi kèm với một link markdown dạng `file://` chuẩn chỉnh (ví dụ: `[filename](file:///D:/path/to/file)`) sử dụng dấu gạch chéo xuôi `/` cho cả môi trường Windows.
* **`#### 5. Bộ kịch bản Test tự động (Postman)`**: Bắt buộc phải viết/cập nhật kịch bản test tự động trong thư mục `postman`. Báo cáo phải tóm tắt rõ các test case được thiết lập (bao gồm các test case Happy Path và Error Path, cơ chế tự động lưu Token và kiểm tra Status Code).
* **`#### 6. Nhật ký lưu trữ`**: Ghi nhận tiến độ công việc trực tiếp vào mục `## 4. TIẾN ĐỘ THỰC HIỆN TÁC VỤ (TASK LOG)` trong file `project_memory_log.md` này bằng cách thêm các Phase mới hoặc đánh dấu hoàn thành mà KHÔNG được xóa đi hay làm hỏng lịch sử của các Phase đã hoàn thành trước đó.
* **`### 🔍 Kết quả kiểm tra`**: Cung cấp bằng chứng biên dịch thành công (kết quả chạy lệnh `dotnet build` với 0 Errors và 0 Warnings) và kết quả chạy thử (nếu có).

### 2. Quy chuẩn viết Code và kiểm tra ràng buộc:
* Thực hiện viết comment chi tiết đáp ứng đúng **Ưu tiên số một** nêu trên cho toàn bộ các file.
* Áp dụng chặt chẽ các ràng buộc nghiệp vụ xóa an toàn (Soft Delete), luôn kiểm tra sự tồn tại của dữ liệu liên quan ở các bảng khác trước khi thực hiện xóa mềm để bảo toàn dữ liệu hệ thống.

---

## 8. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG LẦN ĐẦU (HOW TO RUN FOR THE FIRST TIME)

Dưới đây là các bước chi tiết để khởi chạy toàn bộ hệ thống Phone Service Platform (PSP) lần đầu tiên, dành cho lập trình viên từ trình độ sub-junior trở lên:

### 🛠️ BƯỚC 1: Khởi chạy các dịch vụ nền (Prerequisites)
Trước khi chạy code Backend, bắt buộc các dịch vụ cơ sở dữ liệu và AI sau phải được bật:
1. **SQL Server 2022 Express**:
   * Kiểm tra dịch vụ SQL Server (thường là `MSSQL$SQLEXPRESS`) đã chạy trong Windows Services.
   * Có thể mở **SSMS** (SQL Server Management Studio) và kết nối thử vào `.\SQLEXPRESS` bằng Windows Authentication để đảm bảo DB Engine hoạt động.
2. **Docker Desktop & Qdrant**:
   * Mở ứng dụng **Docker Desktop** trên Windows và đợi trạng thái ở góc dưới bên trái chuyển sang màu xanh lá (Engine Running).
   * Mở terminal (PowerShell) và chạy lệnh: `docker start qdrant` để bật cơ sở dữ liệu Vector Qdrant.
   * Kiểm tra xem Qdrant đã chạy chưa bằng lệnh: `docker ps`. (Phải thấy container `qdrant` ở trạng thái `Up`).
3. **Ollama (AI Model Host)**:
   * Chạy ứng dụng **Ollama** trên Windows (kiểm tra biểu tượng Ollama hình con lạc đà ở khay hệ thống Windows Tray).
   * Đảm bảo model `qwen2.5:7b` đã được tải bằng cách gõ lệnh trong PowerShell: `ollama list`.

### 🚀 BƯỚC 2: Khởi chạy Backend API (ASP.NET Core)
1. Mở **Visual Studio 2026 Insider**.
2. Chọn "Open a project or solution" và trỏ tới file Solution: `D:\Phone-Service-Platform\src\backend\PhoneServicePlatform.slnx`.
3. Trong bảng Solution Explorer (bên phải), nhấp chuột phải vào Project **`PSP.API`** và chọn **Set as Startup Project**.
4. Nhấn nút **F5** (hoặc nút Play "PSP.API" màu xanh trên thanh công cụ) để build và chạy ứng dụng ở chế độ Debug.
   * *Cách chạy bằng CLI*: Mở PowerShell tại thư mục `D:\Phone-Service-Platform` và chạy lệnh: `dotnet run --project src/backend/PSP.API`.

### 🌐 BƯỚC 3: Xác minh hệ thống hoạt động (Verification)
1. **Swagger UI (Tài liệu API)**:
   * Khi Backend khởi chạy thành công, trình duyệt sẽ tự động mở trang Swagger UI tại địa chỉ: `http://localhost:5000/swagger/index.html` (hoặc `https://localhost:5001/swagger/index.html`).
   * Nếu Swagger hiển thị đầy đủ danh sách các API (Auth, Branches, Users, Products...), tức là Backend đã chạy tốt.
2. **Tự động Seeding dữ liệu (Database Seeder)**:
   * Lần đầu tiên chạy, hệ thống sẽ tự động tạo cơ sở dữ liệu `PSP_Database` trong SQL Server (nếu chưa có) và gieo (seed) các dữ liệu mẫu:
     * 1 chi nhánh mặc định ("Trụ sở chính").
     * 5 vai trò hệ thống (Admin, Manager, Sales, Inventory, Technician).
     * 18 quyền hạn hệ thống (Permissions).
     * 1 tài khoản quản trị hệ thống tối cao: Username: **`admin`** | Password: **`Admin@123`**.

### 🧪 BƯỚC 4: Chạy thử kịch bản Test bằng Postman
1. Mở phần mềm **Postman**.
2. Nhấp chọn **Import** ở góc trên bên trái, chọn thư mục `D:\Phone-Service-Platform\postman` và import các bộ sưu tập test (ví dụ: `PSP_Foundation.postman_collection.json`).
3. Chọn request **`POST /api/Auth/login`** (Đăng nhập) trong bộ sưu tập.
4. Gửi request với body JSON mặc định:
   ```json
   {
     "username": "admin",
     "password": "Admin@123"
   }
   ```
5. Nhấn **Send**. Phản hồi trả về mã `200 OK` kèm theo `accessToken` (JWT Token) chứng tỏ hệ thống đã đăng nhập thành công và sẵn sàng kiểm thử các phân hệ khác!

---

## 7. NHẬT KÝ KIỂM TOÁN VÀ CẬP NHẬT TÀI LIỆU (AUDIT & DOCS UPDATE)

**Ngày 07/08/2026:**
- **Thực hiện Technical Audit toàn diện:** Phát hiện 3 nhóm lỗ hổng lớn về Business Logic (Tích điểm RewardPoints, Hóa đơn sửa chữa, Hạng thành viên), Security (80% API thiếu Authorize, XSS LocalStorage, thiếu RBAC), và Document (Trùng mã BR-408).
- **Cập nhật BUSINESS_RULE.md:**
  - Fix trùng lặp quy tắc BR-408 (Đổi quy tắc "Giá nhập phải lớn hơn 0" thành BR-414).
  - Bổ sung quy tắc thu hồi điểm thưởng vào BR-306 khi Hủy đơn (Cancelled).
  - Cập nhật BR-307 yêu cầu CustomerEntity bắt buộc có trường `MemberTier`.
  - Thêm mới BR-1011 yêu cầu Phiếu sửa chữa khi Hoàn thành (Completed) phải sinh ra Hóa đơn (Invoice) để thu tiền và cộng điểm.
  - Cập nhật BR-1603 và thêm BR-1605 bắt buộc thực thi Authorization (`[Authorize]`) và Role-Based Access Control (RBAC) trên tất cả API endpoint bảo mật.
- **Cập nhật DATABASE_DICTIONARY.md:**
  - Bảng `customers`: Bổ sung trường `member_tier`.
  - Bảng `invoices`: Đổi `sales_order_id` thành Nullable (YES) và thêm trường `repair_ticket_id` (Nullable, YES) để hóa đơn có thể gán cho Phiếu sửa chữa.
- **Trạng thái:** Đã trình bày báo cáo kỹ thuật cho USER phê duyệt trước khi bắt đầu sửa đổi mã nguồn.

**Ngày 10/08/2026 - FE-3.9 Purchase Order Backend Remediation:**
- **Phân tích (Audit):** Khảo sát `PurchaseOrderCommandHandlers.cs` và phát hiện lỗ hổng nghiêm trọng: Hoàn tất phiếu nhập không ghi nhận Thẻ kho (Inventory Ledger) và không tăng Công nợ nhà cung cấp (Supplier Debt).
- **Thêm mới & Sửa đổi:** 
  - Bổ sung Type `IMPORT` vào `InventoryTransactionType` trong `Enums.cs`.
  - Cập nhật luồng `CompletePurchaseOrderCommand`: Tích hợp logic sinh Thẻ kho (`InventoryTransactionEntity`), tăng Công nợ (`SupplierEntity.DebtAmount`), và ghi Sổ công nợ (`SupplierDebtTransactionEntity`) vào chung một DbContext Transaction (`SaveChangesAsync()`). Đảm bảo nguyên tắc nguyên tử (Atomicity).
  - Khởi tạo file test mới: `PurchaseOrderWorkflowTests.cs` để test tích hợp và kiểm chứng Double Submit (Idempotency).
- **Lỗi phát sinh & Khắc phục:**
  - **Lỗi 1 (DLL Locked):** `dotnet build` thất bại do `PSP.API.dll` bị khóa bởi tác vụ `dotnet run` đang chạy ngầm. *Khắc phục:* Kill tiến trình đang khóa và build lại thành công.
  - **Lỗi 2 (SQLite RowVersion Constraint):** Test văng lỗi `SQLite Error 19: 'NOT NULL constraint failed: ProductVariants.RowVersion'`. Nguyên nhân: SQLite In-memory Provider không tự sinh byte array cho `[Timestamp]/RowVersion`, dẫn đến chèn NULL vào cột `BLOB NOT NULL`. *Khắc phục:* Cập nhật logic trong `AppDbContext.cs` phần SQLite Workaround: dùng Reflection quét tất cả Entity có property `RowVersion` mang kiểu `byte[]` và tự động set `.HasDefaultValue(new byte[8])`. Điều này fix triệt để mọi lỗi liên quan đến RowVersion trên môi trường Test mà không ảnh hưởng SQL Server Production.
- **Kết quả:** Code Backend đã vá xong Business Gap. 51/51 Tests PASS. Sẵn sàng chờ lệnh bắt đầu FE-3.9 Frontend.


**NgÃ y 10/08/2026 - FE-3.9 Purchase Order Frontend & Gate Verification:**
- **Frontend Implementation:**
  - Khá»Ÿi táº¡o module `purchase-orders` theo chuáº©n FE-3.5 (TanStack Query, React Hook Form, Zod).
  - Viáº¿t `PurchaseOrderListPage` vá»›i tÃ­nh nÄƒng client-side text/status filtering (do backend khÃ´ng há»— trá»£ server-side cho API nÃ y).
  - Viáº¿t `PurchaseOrderFormModal` cho phÃ©p chá»n Supplier, Warehouse, vÃ  Product Variants linh hoáº¡t.
  - Viáº¿t `PurchaseOrderDetailModal` vÃ  Ä‘áº·c biá»‡t lÃ  `CompletePOModal` xá»­ lÃ½ nghiá»‡p vá»¥ quÃ©t IMEI.
  - TÃ­ch há»£p route `/purchase-orders` vÃ o `App.tsx`. Compile vÃ  Build khÃ´ng cÃ³ lá»—i TypeScript (0 errors).
- **Gate Verification (Audit):**
  - **Roadmap Verification:** Kiá»ƒm tra vÃ  xÃ¡c nháº­n Roadmap hoÃ n toÃ n há»£p lá»‡ (FE-3.6 Product, FE-3.7 Customer, FE-3.8 Supplier/Warehouse Ä‘Ã£ thá»±c sá»± Ä‘Æ°á»£c hoÃ n thÃ nh á»Ÿ phiÃªn trÆ°á»›c, khÃ´ng cÃ³ hiá»‡n tÆ°á»£ng nháº£y cÃ³c phase).
  - **Pagination Verification:** Kiá»ƒm chá»©ng API Backend (`GetPurchaseOrdersQuery.cs`). XÃ¡c nháº­n API hiá»‡n táº¡i chá»‰ tráº£ vá» `IEnumerable<PurchaseOrderDto>` mÃ  khÃ´ng cÃ³ tham sá»‘ `page` hay `keyword`. Quyáº¿t Ä‘á»‹nh giá»¯ client-side pagination á»Ÿ Frontend vÃ  ghi nháº­n Ä‘Ã¢y lÃ  Backend Contract Gap.
  - **Business Rules (RowVersion & IMEI):** XÃ¡c nháº­n `CompletePOModal` phÃ­a Frontend yÃªu cáº§u Ä‘Ãºng sá»‘ lÆ°á»£ng IMEI theo quantity cá»§a tá»«ng Variant, báº¯t lá»—i duplicate IMEI á»Ÿ Client, vÃ  xá»­ lÃ½ HTTP 409 (Concurrency/RowVersion) tráº£ vá» thÃ´ng bÃ¡o lá»—i chÃ­nh xÃ¡c khi cÃ³ ngÆ°á»i khÃ¡c duyá»‡t phiáº¿u nháº­p cÃ¹ng lÃºc.
- **Tráº¡ng thÃ¡i:** HoÃ n táº¥t toÃ n bá»™ FE-3.9 Purchase Order. 
- **BÆ°á»›c tiáº¿p theo:** Há»‡ thá»‘ng Ä‘ang HOLD láº¡i, chá» lá»‡nh báº¯t Ä‘áº§u FE-3.10 (Inventory) / FE-3.11 (Stock Take).

**Ng�y 16/08/2026 - FINAL PROJECT CLOSURE AUDIT (Phase 9):**
- **Ti?n tr�nh:** Th?c hi?n ki?m tra to�n di?n l?n cu?i (Final Project Closure Audit). Kh�ng s?a d?i m� ngu?n, ch? d?c v� x�c minh.
- **K?t qu? Build & Test:** dotnet build PASS (0 errors). dotnet test PASS (90/90 tests passed).
- **Database & Schema:** Snapshot v� Migrations ho�n to�n d?ng nh?t. C�c b?ng quan tr?ng d� c� RowVersion v� constraint.
- **Concurrency & Idempotency:** M?i nguy co P0/P1 v? concurrency d� du?c x? l� tri?t d? (Customer RewardPoints, Warranty IMEI swapping, Invoice, Purchase). Idempotency ch?y ?n d?nh (b?o v? double-submit).
- **T?ng k?t l?i (Findings):** P0 = 0, P1 = 0, P2 = 3, P3 = 1.
- **Phase 8:** Module Hangfire Background Jobs du?c x?p h?ng l� Optional/Deferred v� ki?n tr�c hi?n t?i l� single-instance, kh�ng g�y l?i h? th?ng.
- **K?T LU?N CU?I C�NG:** PROJECT = CLOSED / VERIFIED. Backend Phone Service Platform d� s?n s�ng d? d�ng.
**Ngày 16/08/2026 - GIAI ĐOẠN 6: Khách hàng (Customer Loyalty Concurrency):**
- **Tiến trình:** Thực hiện thiết kế Semantic Design, xác minh phạm vi (Scope Audit) và lập kế hoạch (Hardening Plan).
- **Phát hiện (Findings):** Cập nhật điểm thưởng (RewardPoints) bị Race Condition (P0) khi nhiều hóa đơn hoàn thành cùng lúc.
- **Thực thi (Implementation):** Bổ sung RowVersion cho bảng Customers. Áp dụng DbUpdateConcurrencyException bắt lỗi và trả về mã 409 Conflict. Không sửa đổi các API ngoài phạm vi như DeleteCustomer.
- **Xác minh (Verification):** Đạt 4/4 targeted tests và 83/83 regression tests. Đóng Phase 6.

**Ngày 16/08/2026 - GIAI ĐOẠN 7: Bảo hành (Warranty Concurrency & State Machine):**
- **Tiến trình:** Khảo sát, Semantic Design, lập kế hoạch và triển khai.
- **Phát hiện (Findings):** Không có concurrency check khi đổi thiết bị (IMEI swap), dẫn đến nguy cơ (P0) trừ kho thiết bị hai lần nếu xảy ra race condition. State Machine quá lỏng lẻo.
- **Thực thi (Implementation):** Thêm RowVersion vào WarrantyTicketEntity. Xây dựng State Machine strict (chỉ cho phép chuyển trạng thái hợp lệ). Áp dụng concurrency check khi đổi trả thiết bị, đảm bảo chỉ 1 thiết bị bị trừ kho.
- **Xác minh (Verification):** Vượt qua các bài test về IMEI swap concurrency, state machine integrity. Đạt 7/7 targeted tests và 90/90 regression tests. Đóng Phase 7.

**Ngày 16/08/2026 - GIAI ĐOẠN 8 & 9 (FINAL PROJECT CLOSURE AUDIT):**
- **Tiến trình (Phase 8):** Khảo sát Hangfire / Background Jobs. Phát hiện AIInsightsWorker sử dụng Task.Delay (có rủi ro nếu multi-instance), nhưng do hệ thống hiện tại chạy single-instance nên hạ cấp (Downgrade) rủi ro xuống P3. Quyết định: DEFERRED (Không bắt buộc để đóng dự án).
- **Tiến trình (Phase 9):** Thực hiện kiểm tra toàn diện lần cuối (Final Project Closure Audit). Không sửa đổi mã nguồn, chỉ đọc và xác minh.
- **Kết quả Build & Test:** dotnet build PASS (0 errors). dotnet test PASS (90/90 tests passed).
- **Database & Schema:** Snapshot và Migrations hoàn toàn đồng nhất. Các bảng quan trọng đã có RowVersion và constraint.
- **Concurrency & Idempotency:** Mọi nguy cơ P0/P1 về concurrency đã được xử lý triệt để (Customer RewardPoints, Warranty IMEI swapping, Invoice, Purchase). Idempotency chạy ổn định (bảo vệ double-submit).
- **Tổng kết lỗi (Findings):** P0 = 0, P1 = 0, P2 = 3, P3 = 1.
- **KẾT LUẬN CUỐI CÙNG:** PROJECT = CLOSED / VERIFIED. Backend Phone Service Platform đã hoàn thành tất cả các hạng mục trọng yếu.