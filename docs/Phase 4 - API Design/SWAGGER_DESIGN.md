# SWAGGER INTEGRATION & API DOCUMENTATION DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Chuẩn hóa theo ASP.NET Core 10 & OpenAPI)
**Framework:** Swashbuckle.AspNetCore & ASP.NET Core 10 OpenAPI
**Phase:** 4 - API Design

---

## 1. Giới thiệu
Tài liệu này hướng dẫn cách tích hợp và cấu hình Swagger UI / OpenAPI trong dự án ASP.NET Core 10 (`PSP.API`). Thiết lập Swagger giúp đội ngũ phát triển Frontend và QA có tài liệu API trực quan, cho phép kiểm thử trực tiếp 166 RESTful Endpoints trên 25 Controllers cùng cơ chế xác thực JWT Bearer Token tích hợp.

* **Đường dẫn Swagger UI:** `http://localhost:5000/swagger`
* **Đường dẫn OpenAPI Spec JSON:** `http://localhost:5000/swagger/v1/swagger.json`
* **Cổng dịch vụ API Backend:** `5000` (HTTP)

---

## 2. Gói thư viện Sử dụng (.NET 10)
Dự án sử dụng các gói NuGet tiêu chuẩn công nghiệp trong `PSP.API.csproj`:

```xml
<PackageReference Include="Swashbuckle.AspNetCore" Version="7.3.1" />
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="10.0.3" />
```

---

## 3. Cấu hình Swagger trong Program.cs

Trong file `src/backend/PSP.API/Program.cs`, Swagger được đăng ký vào DI Container và kích hoạt Middleware:

```csharp
// Đăng ký dịch vụ SwaggerGen
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Phone Service Platform API",
        Version = "v1",
        Description = "Enterprise RESTful API Platform cho Chuỗi Cửa Hàng Điện Thoại & Trợ Lý AI Cục Bộ (166 Endpoints / 25 Controllers)",
        Contact = new OpenApiContact
        {
            Name = "PSP Engineering Team",
            Email = "support@phonestore.vn"
        }
    });

    // Cấu hình định danh bảo mật JWT Bearer Token
    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Nhập JWT Bearer Token theo định dạng: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };

    options.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});
```

### 3.1 Kích hoạt Swagger UI Middleware
```csharp
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PSP API v1");
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "Phone Service Platform - Swagger UI";
        c.DisplayRequestDuration();
        c.EnableFilter();
    });
}
```

---

## 4. Chuẩn Hóa API Response Envelope
Toàn bộ 166 RESTful API endpoints trong hệ thống đều tuân thủ cấu trúc phong bì JSON chuẩn mực (`ApiResponse<T>`):

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": { ... },
  "correlationId": "4a2b9f6e-1d3c-4e5f-8a9b-0c1d2e3f4a5b",
  "timestamp": "2026-10-22T15:00:00Z"
}
```

Khi phát sinh lỗi nghiệp vụ hoặc ngoại lệ, hệ thống trả về mã lỗi HTTP tương ứng (400, 401, 403, 404, 409, 422, 500) thông qua `GlobalExceptionMiddleware` với envelope thống nhất:

```json
{
  "success": false,
  "code": "INSUFFICIENT_STOCK",
  "message": "Số lượng tồn kho của linh kiện không đủ để xuất kho sửa chữa",
  "errors": [ "Chi nhánh Q1 chỉ còn 2 màn hình iPhone 15 Pro Max (yêu cầu: 3)" ],
  "correlationId": "4a2b9f6e-1d3c-4e5f-8a9b-0c1d2e3f4a5b",
  "timestamp": "2026-10-22T15:00:00Z"
}
```
