# PROJECT_OVERVIEW

## 1. Thông tin dự án

**Tên đề tài:** Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant
**Phiên bản:** 1.0
**Mục tiêu tài liệu:** Xác định tầm nhìn, phạm vi, mục tiêu kinh doanh, đối tượng liên quan, bộ tính năng MVP, công nghệ đề xuất và lộ trình phát triển tổng thể cho dự án.

---

## 2. Vision

Xây dựng một hệ thống quản lý tập trung cho chuỗi cửa hàng điện thoại, hỗ trợ toàn bộ quy trình vận hành từ bán hàng, quản lý khách hàng, quản lý sản phẩm, kho, sửa chữa, bảo hành đến báo cáo điều hành.

Điểm khác biệt cốt lõi của hệ thống là tích hợp **AI Assistant** để hỗ trợ người dùng tra cứu thông tin, hỏi đáp nghiệp vụ, phân tích dữ liệu, gợi ý thao tác và tự động hóa một phần công việc vận hành.

Hệ thống hướng đến 3 giá trị chính:

* **Chuẩn hóa quy trình** trong toàn chuỗi cửa hàng
* **Giảm thao tác thủ công** và sai sót vận hành
* **Tăng năng suất ra quyết định** nhờ dữ liệu và AI

---

## 3. Problem Statement

Các chuỗi cửa hàng điện thoại thường gặp những vấn đề sau:

* Dữ liệu bị phân tán giữa nhiều chi nhánh
* Khó theo dõi tồn kho theo thời gian thực
* Quy trình bán hàng, sửa chữa, bảo hành chưa đồng bộ
* Nhân viên phải tra cứu nhiều nơi để lấy thông tin
* Báo cáo quản trị chậm, thiếu tính trực quan
* Khó áp dụng AI vào nghiệp vụ nếu không có nền tảng dữ liệu tốt

Dự án này giải quyết các vấn đề trên bằng một hệ thống thống nhất, có khả năng mở rộng và tích hợp AI ngay từ đầu.

---

## 4. Business Goals

### 4.1 Mục tiêu kinh doanh

* Quản lý tập trung toàn bộ hoạt động của chuỗi cửa hàng
* Tăng tốc độ xử lý đơn hàng và nghiệp vụ nội bộ
* Giảm thất thoát và sai lệch kho
* Nâng cao chất lượng phục vụ khách hàng
* Hỗ trợ nhà quản lý ra quyết định nhanh hơn

### 4.2 Mục tiêu vận hành

* Theo dõi tồn kho theo chi nhánh và IMEI
* Đồng bộ dữ liệu khách hàng, đơn hàng, bảo hành và sửa chữa
* Chuẩn hóa quy trình làm việc giữa các vai trò
* Tạo điều kiện cho AI Assistant truy cập dữ liệu có kiểm soát

### 4.3 Mục tiêu kỹ thuật

* Thiết kế theo hướng module hóa, dễ mở rộng
* Có khả năng triển khai bằng Docker Compose
* Tách rõ backend, frontend, AI service và database
* Hỗ trợ tích hợp RAG, vector database và tool calling trong giai đoạn AI

---

## 5. Scope

### 5.1 Trong phạm vi

Hệ thống sẽ bao gồm các phân hệ chính sau:

* Quản lý người dùng và phân quyền
* Quản lý chi nhánh
* Quản lý khách hàng
* Quản lý sản phẩm
* Quản lý danh mục, thương hiệu, model
* Quản lý kho
* Quản lý bán hàng và hóa đơn
* Quản lý sửa chữa
* Quản lý bảo hành
* Dashboard báo cáo
* AI Assistant hỗ trợ nghiệp vụ

### 5.2 Ngoài phạm vi

Các hạng mục sau không nằm trong MVP ban đầu:

* Website thương mại điện tử cho khách hàng cuối
* Ứng dụng di động riêng
* ERP đầy đủ
* Kế toán tổng hợp
* CRM marketing nâng cao
* Tích hợp vận chuyển và giao hàng bên thứ ba
* Thanh toán online đa cổng phức tạp

---

## 6. Stakeholders

### 6.1 Chủ cửa hàng / Chủ hệ thống

Người có quyền cao nhất, theo dõi toàn bộ hoạt động kinh doanh, doanh thu, tồn kho và hiệu quả vận hành của các chi nhánh.

### 6.2 Quản lý chi nhánh

Chịu trách nhiệm điều phối hoạt động tại từng cửa hàng, theo dõi nhân sự, kho, bán hàng, sửa chữa và các chỉ số vận hành.

### 6.3 Nhân viên bán hàng

Thực hiện tư vấn, tạo đơn hàng, lập hóa đơn, tra cứu sản phẩm và chăm sóc khách hàng.

### 6.4 Nhân viên kho

Thực hiện nhập kho, xuất kho, chuyển kho, kiểm kho và cập nhật số liệu hàng hóa.

### 6.5 Kỹ thuật viên sửa chữa

Tiếp nhận máy, đánh giá lỗi, cập nhật tiến độ, báo giá sửa chữa và bàn giao máy cho khách hàng.

### 6.6 Nhân viên bảo hành

Theo dõi thời hạn bảo hành, tiếp nhận yêu cầu bảo hành, xử lý đổi trả hoặc hỗ trợ kiểm tra tình trạng máy.

### 6.7 Khách hàng

Được lưu thông tin mua hàng, lịch sử sửa chữa, lịch sử bảo hành và trạng thái xử lý thiết bị.

### 6.8 AI Assistant

Trợ lý ảo nội bộ hỗ trợ tra cứu, phân tích, gợi ý và tự động hóa các nghiệp vụ có kiểm soát.

---

## 7. MVP Feature List

### 7.1 Authentication & Authorization

* Đăng nhập / đăng xuất
* JWT authentication
* Refresh token
* Phân quyền theo vai trò
* Kiểm soát truy cập theo chức năng

### 7.2 User Management

* Quản lý người dùng
* Quản lý vai trò
* Quản lý quyền
* Gán quyền theo chi nhánh hoặc hệ thống

### 7.3 Branch Management

* CRUD chi nhánh
* Gán nhân sự cho chi nhánh
* Theo dõi trạng thái hoạt động

### 7.4 Customer Management

* CRUD khách hàng
* Lưu lịch sử mua hàng
* Lưu lịch sử bảo hành và sửa chữa
* Tra cứu khách hàng nhanh

### 7.5 Product Management

* CRUD sản phẩm
* Quản lý thương hiệu
* Quản lý model
* Quản lý danh mục
* Quản lý màu sắc, dung lượng, IMEI

### 7.6 Inventory Management

* Nhập kho
* Xuất kho
* Chuyển kho giữa chi nhánh
* Kiểm kho
* Theo dõi tồn kho theo IMEI và số lượng

### 7.7 Sales Management

* Tạo đơn bán hàng
* Lập hóa đơn
* Thanh toán
* Áp dụng voucher hoặc khuyến mãi
* In / xuất hóa đơn

### 7.8 Warranty Management

* Kiểm tra thời hạn bảo hành
* Tạo phiếu bảo hành
* Xử lý đổi máy hoặc tiếp nhận sửa chữa bảo hành
* Theo dõi trạng thái bảo hành

### 7.9 Repair Management

* Tạo phiếu sửa chữa
* Ghi nhận lỗi
* Báo giá
* Cập nhật tiến độ
* Hoàn tất và bàn giao

### 7.10 Dashboard & Reporting

* Doanh thu theo ngày / tháng / chi nhánh
* Tồn kho
* Top sản phẩm bán chạy
* Tình trạng sửa chữa
* KPI nhân viên

### 7.11 AI Assistant

* Chat hỏi đáp nghiệp vụ
* Tra cứu dữ liệu hệ thống
* Gợi ý xử lý tình huống
* Hỗ trợ tạo báo cáo
* Phân tích tồn kho và doanh thu
* Hỗ trợ nhân viên nhập liệu hoặc tóm tắt thông tin

---

## 8. Technology Stack

### 8.1 Backend

* Java 21
* Spring Boot 3
* Spring Security
* Spring Data JPA
* Hibernate
* Maven

### 8.2 Database

* PostgreSQL

### 8.3 Cache / Session / Messaging

* Redis

### 8.4 AI Layer

* Ollama
* Qwen
* LangChain4j
* Qdrant
* Embedding model

### 8.5 Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* Shadcn UI

### 8.6 API

* REST API
* OpenAPI / Swagger

### 8.7 DevOps

* Docker
* Docker Compose
* GitHub Actions

### 8.8 Storage

* MinIO hoặc local file storage tùy giai đoạn phát triển

---

## 9. Development Principles

* Thiết kế theo hướng module hóa
* Tách biệt rõ nghiệp vụ, dữ liệu và giao diện
* Ưu tiên tính đúng của business rule trước khi tối ưu UI
* Mọi workflow quan trọng phải được mô tả trước khi code
* AI chỉ hoạt động trên dữ liệu và quy tắc đã được kiểm soát
* Dữ liệu phải có khả năng truy vết
* Tài liệu phải được cập nhật xuyên suốt các phase

---

## 10. Success Criteria

Dự án được xem là thành công khi đạt các tiêu chí sau:

* Quản lý được nhiều chi nhánh trong một hệ thống
* Theo dõi kho chính xác theo sản phẩm và IMEI
* Đồng bộ dữ liệu bán hàng, bảo hành và sửa chữa
* Báo cáo vận hành rõ ràng, dễ tra cứu
* AI Assistant trả lời đúng dựa trên dữ liệu nội bộ
* Hệ thống chạy ổn định với kiến trúc dễ mở rộng
* Có thể triển khai bằng Docker Compose với cấu hình chuẩn

---

## 11. Assumptions

* Mỗi sản phẩm có thể được quản lý theo model và IMEI
* Chuỗi cửa hàng có nhiều vai trò người dùng với quyền khác nhau
* Mỗi chi nhánh có tồn kho riêng
* AI Assistant chỉ được phép truy cập dữ liệu theo quyền
* Hệ thống sẽ ưu tiên nghiệp vụ nội bộ trước, sau đó mới mở rộng ra các tính năng bên ngoài

---

## 12. Risks

### 12.1 Rủi ro nghiệp vụ

* Quy trình sửa chữa và bảo hành có nhiều ngoại lệ
* Dữ liệu kho dễ phát sinh sai lệch nếu không kiểm soát chặt

### 12.2 Rủi ro kỹ thuật

* Tích hợp AI sớm khi dữ liệu chưa chuẩn hóa
* Thiết kế database không đủ linh hoạt cho nhiều chi nhánh
* API không đồng nhất giữa các module

### 12.3 Rủi ro vận hành

* Người dùng nhập liệu không đúng quy chuẩn
* Sai phân quyền giữa các vai trò
* Đồng bộ dữ liệu chậm giữa các phân hệ

---

## 13. High-Level Roadmap

### Phase 0 – Foundation

Xác định vision, scope, goals, stakeholders, MVP, tech stack và roadmap.

### Phase 1 – Business Analysis

Phân tích yêu cầu chức năng, phi chức năng, business rule và workflow.

### Phase 2 – Database Design

Thiết kế ERD, dictionary, constraint, index và migration plan.

### Phase 3 – System Architecture

Thiết kế kiến trúc tổng thể, clean architecture và structure module.

### Phase 4 – API Design

Thiết kế API contract, status code, response format và swagger.

### Phase 5 – AI Design

Thiết kế AI architecture, prompt, agent, RAG, memory và tool calling.

### Phase 6 – UI Design

Thiết kế screen flow, wireframe và navigation.

### Phase 7 – AI Context

Chuẩn hóa bộ context để AI sinh code đúng nghiệp vụ và kiến trúc.

### Phase 8 – Backend Generation

Sinh backend theo từng module, bắt đầu từ authentication.

### Phase 9 – Frontend Generation

Sinh giao diện theo API đã chốt.

### Phase 10 – AI Integration

Tích hợp AI Assistant, RAG, vector database và chat workflow.

### Phase 11 – Testing

Kiểm thử manual, API, prompt và AI behavior.

### Phase 12 – Documentation

Hoàn thiện tài liệu hệ thống, hướng dẫn cài đặt và triển khai.

### Phase 13 – Deployment

Đóng gói và triển khai bằng Docker, PostgreSQL, Redis, Ollama, Qdrant.

---

## 14. Deliverable of Phase 0

Kết quả đầu ra của Phase 0 gồm:

* `PROJECT_OVERVIEW.md`
* `MODULE_LIST.md`
* `GLOSSARY.md`
* `RISK_ANALYSIS.md`

Trong đó, `PROJECT_OVERVIEW.md` là tài liệu nền tảng trung tâm để dẫn dắt toàn bộ các phase tiếp theo.

---

## 15. Final Note

Tài liệu này được viết để dùng làm nền khởi tạo dự án, có thể tiếp tục mở rộng thành bộ tài liệu phân tích và thiết kế đầy đủ cho đồ án hoặc sản phẩm thực tế.
