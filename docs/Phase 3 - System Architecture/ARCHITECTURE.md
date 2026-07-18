# SYSTEM ARCHITECTURE DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Cập nhật theo thực tế triển khai)
**Pattern:** Clean Architecture & CQRS
**Phase:** 3 - System Architecture

---

## 1. Mục tiêu kiến trúc
Để đảm bảo hệ thống vận hành ổn định trên môi trường thực tế, dễ bảo trì, dễ mở rộng quy mô chi nhánh và tích hợp linh hoạt các LLM (Large Language Model) khác nhau, hệ thống tuân thủ 4 nguyên tắc kiến trúc cốt lõi:
1. **Clean Architecture (Kiến trúc sạch):** Độc lập hoàn toàn giữa Business Logic (Nghiệp vụ) và Framework/Database/UI. Logic cốt lõi không thay đổi khi chuyển từ SQL Server sang database khác hoặc cập nhật framework.
2. **CQRS (Command Query Responsibility Segregation):** Tách biệt rõ ràng luồng đọc (Query) và luồng ghi (Command). Tăng performance và phân định rạch ròi trách nhiệm của từng Endpoint.
3. **Loosely Coupled (Liên kết lỏng):** Sử dụng MediatR để giao tiếp trong Application Layer, loại bỏ sự phụ thuộc chéo giữa các Services.
4. **AI-Orchestrated (Định hướng tích hợp AI):** AI Assistant được thiết kế như một công cụ hỗ trợ nhân viên, tích hợp RAG và Tool Calling API an toàn.

---

## 2. Mô hình Clean Architecture 4 lớp

Hệ thống được tổ chức thành 4 phân lớp đồng tâm. Nguyên tắc phụ thuộc (Dependency Rule) quy định: **Chiều phụ thuộc chỉ đi từ ngoài vào trong, lớp trong không biết gì về lớp ngoài.**

```text
       ┌─────────────────────────────────────────────────────────┐
       │ API Layer (Controllers, Middlewares, SignalR/WebSockets)│
       │   └─────────────────────────────────────────────────┘   │
       │   │ Application Layer (CQRS, MediatR, DTOs, Behaviors)  │
       │   │   └─────────────────────────────────────────┘       │
       │   │   │ Domain Layer (Entities, Enums, Exceptions)      │
       │   │   │   └─────────────────────────────────┘           │
       │   │   │   │    Core Entities & Business     │           │
       │   │   │   └─────────────────────────────────┘           │
       │   │   └─────────────────────────────────────────┘       │
       │   │   │ Infrastructure Layer (EF Core, SQL Server)      │
       │   └─────────────────────────────────────────────────┘   │
       └─────────────────────────────────────────────────────────┘
```

### 2.1 Domain Layer (`PSP.Domain`)
* **Vị trí:** Trung tâm của hệ thống, không phụ thuộc vào bất kỳ thư viện hay database framework nào (Chỉ sử dụng C# thuần).
* **Thành phần:**
  * **BaseEntity:** Lớp nền tảng chứa Id, CreatedAt, UpdatedAt, IsDeleted.
  * **Entities:** Các đối tượng nghiệp vụ (e.g. `UserEntity`, `SalesOrderEntity`).
  * **Enums:** Trạng thái hệ thống (e.g. `SalesOrderStatus`).
  * **Custom Exceptions:** Các lỗi nghiệp vụ (e.g. `BusinessException`, `NotFoundException`).

### 2.2 Application Layer (`PSP.Application`)
* **Vị trí:** Lớp trung gian định nghĩa các luồng công việc cụ thể qua CQRS.
* **Thành phần:**
  * **Commands & Queries:** Đối tượng request đầu vào.
  * **Handlers:** Xử lý nghiệp vụ (thông qua MediatR).
  * **Behaviors:** Pipeline behavior (e.g. `ValidationBehavior` dùng FluentValidation).
  * **Interfaces:** `IRepository<T>`, `IUnitOfWork`, `ICurrentUserService`.
  * **ApiResponse:** Wrapper chuẩn trả về cho Client.

### 2.3 Infrastructure Layer (`PSP.Infrastructure`)
* **Vị trí:** Lớp ngoài cùng bên dưới, chứa cài đặt giao tiếp dữ liệu.
* **Thành phần:**
  * **EF Core Data Context:** `AppDbContext`, Fluent API Configurations.
  * **Repositories:** Cài đặt `Repository<T>` và `UnitOfWork`.
  * **External Services:** Kết nối ngoài (File Storage, AI/Ollama, Logging với Serilog).

### 2.4 API Layer (`PSP.API`)
* **Vị trí:** Lớp ngoài cùng tiếp xúc trực tiếp với người dùng và hệ thống bên ngoài.
* **Thành phần:**
  * **Controllers:** Kế thừa `BaseApiController`, nhận Request, đẩy vào MediatR.
  * **Middlewares:** `GlobalExceptionMiddleware` xử lý lỗi tập trung.
  * **Auth:** Cấu hình JwtBearer, Swagger.

---

## 3. Cấu trúc Solution (.NET 10)

Mã nguồn được tổ chức thành 4 Class Library & Web API project:

```text
PhoneServicePlatform.slnx
├── PSP.Domain/                                # Không có Dependencies ngoài C# thuần
│   ├── Common/
│   │   └── Entities/BaseEntity.cs
│   └── Modules/
│       ├── Auth/Entities/UserEntity.cs
│       ├── Sales/Entities/SalesOrderEntity.cs
│       └── ...
│
├── PSP.Application/                           # Phụ thuộc: PSP.Domain, MediatR, FluentValidation
│   ├── Common/
│   │   ├── Behaviors/ValidationBehavior.cs
│   │   ├── Interfaces/IUnitOfWork.cs
│   │   └── Models/ApiResponse.cs
│   └── Modules/
│       └── Auth/
│           ├── Commands/LoginCommand.cs
│           ├── Queries/GetUserQuery.cs
│           └── Handlers/LoginCommandHandler.cs
│
├── PSP.Infrastructure/                        # Phụ thuộc: PSP.Application, EF Core, SQL Server
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Configurations/
│   └── Repositories/
│       ├── Repository.cs
│       └── UnitOfWork.cs
│
└── PSP.API/                                   # Phụ thuộc: PSP.Application, PSP.Infrastructure
    ├── Controllers/
    │   ├── BaseApiController.cs
    │   └── AuthController.cs
    ├── Middlewares/
    │   └── GlobalExceptionMiddleware.cs
    └── Program.cs
```

---

## 4. Cơ chế giao tiếp & Xử lý (CQRS)

Thay vì dùng Service gọi Service lằng nhằng, mọi Request từ Controller đều được đóng gói thành Command hoặc Query và gửi đi thông qua **MediatR**.

1. **Controller** nhận HTTP Request.
2. Đóng gói thành `CreateOrderCommand`.
3. Gửi vào `Mediator.Send(command)`.
4. **ValidationBehavior** tự động chặn lại, dùng `FluentValidation` để kiểm tra dữ liệu. Nếu lỗi ném ra `ValidationException`.
5. **CreateOrderCommandHandler** nhận lệnh, dùng `IUnitOfWork` và `IRepository` để xử lý logic, ghi vào Database.
6. Trả kết quả về Controller.
7. Controller hoặc Middleware sẽ bọc kết quả lại bằng `ApiResponse<T>`.

---

## 5. Kiến trúc tích hợp AI Assistant (RAG & Tool Calling)

AI Assistant được thiết kế phục vụ nhân viên nội bộ:

* **Mô hình AI:** Local LLM (ví dụ: Ollama + Qwen3) kết hợp VectorDB (Qdrant) hoặc dùng thư viện Semantic Kernel.
* **Entities:** `AIConversationEntity`, `AIMessageEntity`, `AIKnowledgeDocumentEntity`.
* **Luồng xử lý (RAG):** Người dùng hỏi -> Embedding -> Qdrant search context -> LLM sinh câu trả lời.
* **Tool Calling:** LLM tự quyết định gọi các Endpoint API (hoặc Use Case) để tra cứu tồn kho, tình trạng phiếu sửa chữa theo realtime, từ đó trả lời nhân viên.

---

## 6. Môi trường triển khai
* **Backend:** ASP.NET Core 10.
* **Database:** SQL Server 2022.
* **IDE:** Visual Studio 2026.
* **Logs:** Serilog (File sink + SQL Server sink).
