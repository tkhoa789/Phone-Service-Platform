# SWAGGER INTEGRATION & UI DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Framework:** Springdoc OpenAPI v2 (Spring Boot 3)
**Phase:** 4 - API Design

---

## 1. Giới thiệu
Tài liệu này hướng dẫn cách tích hợp và thiết lập Swagger UI / OpenAPI 3.0 trong dự án Spring Boot 3. Thiết lập Swagger giúp đội ngũ phát triển Frontend và kiểm thử viên có tài liệu API trực quan, chạy thử nghiệm trực tiếp trên giao diện web (Interactive API console) mà không cần phụ thuộc vào Postman.

---

## 2. Thư viện tích hợp (Dependencies)
Dự án sử dụng thư viện **Springdoc OpenAPI Starter** tương thích hoàn toàn với Spring Boot 3 và Jakarta EE:

```xml
<!-- Maven Dependency in pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>
```

---

## 3. Cấu hình Môi trường (Properties Configuration)
Cấu hình đường dẫn truy cập và kích hoạt tài liệu trong file `application.yml`:

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: alpha
    tagsSorter: alpha
    doc-expansion: none
  show-actuator: true
```

* **Đường dẫn Swagger UI:** `http://localhost:8080/swagger-ui/index.html`
* **Đường dẫn API Docs JSON:** `http://localhost:8080/v3/api-docs`

---

## 4. Thiết lập Lớp Cấu hình Java (OpenAPI Config)
Để kích hoạt tính năng xác thực bằng Bearer Token (JWT) trên toàn bộ giao diện Swagger UI, chúng ta khai báo cấu hình Java sau:

```java
package com.phonestore.shared.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "BearerAuth";
        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Nhập token JWT vào đây để xác thực API (Bearer <token>).")
                        ))
                .info(new Info()
                        .title("Phone Store & AI Assistant Management System API")
                        .version("1.0")
                        .description("Tài liệu đặc tả toàn bộ API hệ thống chuỗi cửa hàng điện thoại và trợ lý AI.")
                        .contact(new Contact()
                                .name("Đội ngũ phát triển")
                                .email("dev@phonestore.com")
                        ));
    }
}
```

---

## 5. Quy chuẩn Thiết kế Phản hồi (Standard Response Envelope)
Mọi API trong hệ thống đều tuân thủ cấu trúc đóng gói dữ liệu duy nhất (Response Envelope Pattern) để đảm bảo tính đồng bộ và giúp Frontend xử lý dễ dàng:

### 5.1 Cấu trúc Phản hồi Thành công (200 OK / 201 Created)
```json
{
  "success": true,
  "message": "Thực hiện thành công",
  "data": {
    "id": "e1d2c3b4-a5f6-7e8d-9c0b-1a2b3c4d5e01",
    "code": "BR001",
    "name": "Chi nhánh Quận 1"
  },
  "errorCode": null,
  "timestamp": "2026-07-12T14:03:33.123Z"
}
```

### 5.2 Cấu trúc Phản hồi Lỗi (4xx / 5xx)
Khi phát sinh lỗi (lỗi nghiệp vụ, lỗi phân quyền, lỗi hệ thống), API sẽ trả về cấu trúc lỗi chứa mã lỗi nghiệp vụ tương ứng (`errorCode`):
```json
{
  "success": false,
  "message": "Không tìm thấy sản phẩm trong kho",
  "data": null,
  "errorCode": "INVENTORY_002",
  "timestamp": "2026-07-12T14:03:33.456Z"
}
```

---

## 6. Định hướng viết Annotation trên Controller mẫu
Khi sinh code backend ở Phase 8, các Controller cần được gán các Annotation sau để mô tả dữ liệu trên Swagger:

```java
@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product Catalog", description = "Các API quản lý sản phẩm, thương hiệu, danh mục")
public class ProductController {

    @Operation(summary = "Tạo sản phẩm mới", description = "Cho phép quản lý tạo sản phẩm mới. Yêu cầu quyền PRODUCT_CREATE.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Sản phẩm được tạo thành công"),
        @ApiResponse(responseCode = "400", description = "Tham số gửi lên không hợp lệ"),
        @ApiResponse(responseCode = "403", description = "Không có quyền thực hiện hành động này")
    })
    @PostMapping
    public ResponseEntity<ResponseEnvelope<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {
        // Implementation
    }
}
```
Cơ chế này bảo đảm tài liệu Swagger luôn cập nhật tự động (Live Document) song hành cùng mã nguồn thực tế.
