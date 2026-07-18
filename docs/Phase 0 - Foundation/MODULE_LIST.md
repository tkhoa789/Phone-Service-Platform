# MODULE_LIST

## 1. Mục đích tài liệu

Tài liệu này dùng để liệt kê toàn bộ các module chính của hệ thống **Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant**, đồng thời xác định phạm vi, vai trò và mức độ ưu tiên của từng module trong quá trình phát triển.

Tài liệu này là đầu vào quan trọng cho:

* Business Analysis
* Database Design
* System Architecture
* API Design
* AI Design
* Backend Development
* Frontend Development

---

## 2. Nguyên tắc phân rã module

Hệ thống được chia thành các module theo nguyên tắc sau:

* Mỗi module xử lý một nhóm nghiệp vụ rõ ràng
* Module phải có trách nhiệm độc lập, hạn chế chồng chéo
* Các module nghiệp vụ phải tách biệt với module hệ thống
* AI Assistant là module riêng nhưng có khả năng truy cập dữ liệu theo quyền hạn
* Các module phải có thể phát triển tuần tự theo ưu tiên MVP

---

## 3. Danh sách module tổng quan

### 3.1 Module nền tảng hệ thống

1. Authentication
2. Authorization / RBAC
3. User Management
4. Role & Permission Management
5. Branch Management
6. Audit Log
7. Notification

### 3.2 Module nghiệp vụ chính

8. Customer Management
9. Product Management
10. Category Management
11. Brand Management
12. Model / Variant Management
13. Inventory Management
14. Purchase / Import Management
15. Sales / POS Management
16. Invoice Management
17. Payment Management
18. Promotion / Voucher Management
19. Warranty Management
20. Repair Management
21. Return / Exchange Management
22. Delivery / Handover Management
23. Reporting / Dashboard

### 3.3 Module AI và dữ liệu thông minh

24. AI Assistant
25. Knowledge Base
26. RAG Service
27. Vector Storage
28. Embedding Service
29. Prompt Management
30. Tool Calling Service
31. AI Memory
32. AI Log / AI Audit

### 3.4 Module hỗ trợ kỹ thuật

33. File Management
34. Configuration Management
35. Cache Management
36. Background Job / Scheduler
37. System Health Monitoring

---

## 4. Chi tiết từng module

### 4.1 Authentication

**Mục tiêu:** Xác thực người dùng khi đăng nhập hệ thống.

**Chức năng chính:**

* Đăng nhập
* Đăng xuất
* Refresh token
* Đổi mật khẩu
* Quên mật khẩu

**Đầu ra:**

* Session hoặc token hợp lệ cho các chức năng tiếp theo

---

### 4.2 Authorization / RBAC

**Mục tiêu:** Kiểm soát quyền truy cập theo vai trò và chức năng.

**Chức năng chính:**

* Phân quyền theo role
* Phân quyền theo chức năng
* Phân quyền theo chi nhánh nếu cần
* Kiểm tra quyền ở API và UI

---

### 4.3 User Management

**Mục tiêu:** Quản lý tài khoản nhân sự trong hệ thống.

**Chức năng chính:**

* CRUD user
* Gán role
* Gán chi nhánh
* Kích hoạt / vô hiệu hóa tài khoản

---

### 4.4 Role & Permission Management

**Mục tiêu:** Quản lý bộ vai trò và quyền hệ thống.

**Chức năng chính:**

* CRUD role
* CRUD permission
* Mapping role-permission
* Mapping role-branch nếu cần

---

### 4.5 Branch Management

**Mục tiêu:** Quản lý chi nhánh trong chuỗi cửa hàng.

**Chức năng chính:**

* CRUD chi nhánh
* Trạng thái hoạt động
* Địa chỉ, số điện thoại, người phụ trách
* Gán nhân sự cho chi nhánh

---

### 4.6 Audit Log

**Mục tiêu:** Ghi nhận lịch sử thao tác quan trọng của người dùng.

**Chức năng chính:**

* Ghi log tạo / sửa / xóa
* Ghi log đăng nhập
* Ghi log thay đổi nghiệp vụ quan trọng
* Truy vết khi có sự cố

---

### 4.7 Notification

**Mục tiêu:** Thông báo các sự kiện nghiệp vụ và hệ thống.

**Chức năng chính:**

* Thông báo nội bộ
* Thông báo trạng thái sửa chữa
* Thông báo bảo hành
* Thông báo tồn kho thấp
* Thông báo AI hoặc hệ thống

---

### 4.8 Customer Management

**Mục tiêu:** Quản lý thông tin khách hàng.

**Chức năng chính:**

* CRUD khách hàng
* Lưu lịch sử mua hàng
* Lưu lịch sử sửa chữa
* Lưu lịch sử bảo hành
* Tra cứu khách hàng nhanh

---

### 4.9 Product Management

**Mục tiêu:** Quản lý sản phẩm bán ra và tồn kho.

**Chức năng chính:**

* CRUD sản phẩm
* Quản lý thông tin sản phẩm
* Quản lý IMEI
* Quản lý trạng thái máy
* Quản lý giá nhập / giá bán

---

### 4.10 Category Management

**Mục tiêu:** Quản lý nhóm danh mục sản phẩm.

**Chức năng chính:**

* CRUD category
* Phân loại sản phẩm theo nhóm
* Hỗ trợ lọc và thống kê

---

### 4.11 Brand Management

**Mục tiêu:** Quản lý thương hiệu sản phẩm.

**Chức năng chính:**

* CRUD brand
* Gắn thương hiệu với sản phẩm
* Hỗ trợ báo cáo theo hãng

---

### 4.12 Model / Variant Management

**Mục tiêu:** Quản lý model và biến thể của sản phẩm.

**Chức năng chính:**

* CRUD model
* Quản lý màu sắc, dung lượng, phiên bản
* Hỗ trợ phân biệt từng thiết bị cụ thể

---

### 4.13 Inventory Management

**Mục tiêu:** Quản lý tồn kho theo chi nhánh và trạng thái hàng.

**Chức năng chính:**

* Nhập kho
* Xuất kho
* Chuyển kho
* Kiểm kho
* Điều chỉnh kho
* Theo dõi tồn kho theo IMEI / số lượng

---

### 4.14 Purchase / Import Management

**Mục tiêu:** Quản lý nghiệp vụ nhập hàng từ nhà cung cấp.

**Chức năng chính:**

* Tạo phiếu nhập
* Ghi nhận giá nhập
* Theo dõi nhà cung cấp
* Cập nhật tồn kho sau nhập

---

### 4.15 Sales / POS Management

**Mục tiêu:** Quản lý bán hàng tại quầy.

**Chức năng chính:**

* Tạo đơn bán hàng
* Tra cứu sản phẩm
* Áp dụng khuyến mãi
* Tính tổng tiền
* Xác nhận thanh toán

---

### 4.16 Invoice Management

**Mục tiêu:** Quản lý hóa đơn và chứng từ bán hàng.

**Chức năng chính:**

* Sinh hóa đơn
* Xem chi tiết hóa đơn
* In / xuất hóa đơn
* Tra cứu lịch sử hóa đơn

---

### 4.17 Payment Management

**Mục tiêu:** Quản lý các hình thức thanh toán.

**Chức năng chính:**

* Thanh toán tiền mặt
* Chuyển khoản
* Thanh toán nhiều phương thức
* Ghi nhận trạng thái thanh toán

---

### 4.18 Promotion / Voucher Management

**Mục tiêu:** Quản lý khuyến mãi và mã giảm giá.

**Chức năng chính:**

* CRUD voucher
* Điều kiện áp dụng
* Giới hạn thời gian
* Giới hạn chi nhánh hoặc sản phẩm

---

### 4.19 Warranty Management

**Mục tiêu:** Quản lý bảo hành sản phẩm.

**Chức năng chính:**

* Tra cứu thời hạn bảo hành
* Tạo phiếu bảo hành
* Xử lý đổi trả hoặc tiếp nhận máy
* Cập nhật trạng thái bảo hành

---

### 4.20 Repair Management

**Mục tiêu:** Quản lý quy trình sửa chữa thiết bị.

**Chức năng chính:**

* Tiếp nhận máy
* Ghi lỗi
* Báo giá sửa chữa
* Cập nhật tiến độ
* Bàn giao máy sau sửa

---

### 4.21 Return / Exchange Management

**Mục tiêu:** Quản lý đổi trả hàng theo chính sách kinh doanh.

**Chức năng chính:**

* Tạo yêu cầu đổi trả
* Kiểm tra điều kiện áp dụng
* Cập nhật tồn kho và hóa đơn liên quan

---

### 4.22 Delivery / Handover Management

**Mục tiêu:** Quản lý bàn giao sản phẩm hoặc máy sửa chữa cho khách hàng.

**Chức năng chính:**

* Xác nhận bàn giao
* Cập nhật trạng thái
* Lưu dấu vết bàn giao

---

### 4.23 Reporting / Dashboard

**Mục tiêu:** Cung cấp số liệu điều hành và phân tích.

**Chức năng chính:**

* Doanh thu theo ngày / tháng / chi nhánh
* Tồn kho
* Lợi nhuận
* Top sản phẩm
* KPI nhân viên
* Trạng thái bảo hành và sửa chữa

---

## 5. Module AI và dữ liệu thông minh

### 5.1 AI Assistant

**Mục tiêu:** Trợ lý ảo hỗ trợ người dùng trong hệ thống.

**Chức năng chính:**

* Hỏi đáp nghiệp vụ
* Tra cứu dữ liệu nội bộ
* Gợi ý thao tác
* Tóm tắt thông tin
* Sinh báo cáo
* Hỗ trợ phân tích

---

### 5.2 Knowledge Base

**Mục tiêu:** Kho tri thức nội bộ cho AI.

**Chức năng chính:**

* Lưu chính sách
* Lưu business rule
* Lưu hướng dẫn thao tác
* Lưu tài liệu nghiệp vụ

---

### 5.3 RAG Service

**Mục tiêu:** Truy xuất tri thức liên quan trước khi AI trả lời.

**Chức năng chính:**

* Tìm kiếm ngữ nghĩa
* Lấy context liên quan
* Hạn chế trả lời sai lệch

---

### 5.4 Vector Storage

**Mục tiêu:** Lưu embedding phục vụ tìm kiếm ngữ nghĩa.

**Chức năng chính:**

* Lưu vector tài liệu
* Tra cứu similarity
* Hỗ trợ RAG

---

### 5.5 Embedding Service

**Mục tiêu:** Sinh vector embedding từ dữ liệu văn bản.

**Chức năng chính:**

* Chunk text
* Tạo embedding
* Đồng bộ với vector DB

---

### 5.6 Prompt Management

**Mục tiêu:** Quản lý prompt hệ thống và prompt theo tác vụ.

**Chức năng chính:**

* Prompt cho chat
* Prompt cho agent
* Prompt cho summary
* Prompt cho tool calling

---

### 5.7 Tool Calling Service

**Mục tiêu:** Cho phép AI gọi các công cụ nội bộ.

**Chức năng chính:**

* Tra cứu dữ liệu
* Gọi API nội bộ
* Sinh báo cáo
* Tìm sản phẩm, khách hàng, hóa đơn

---

### 5.8 AI Memory

**Mục tiêu:** Lưu ngữ cảnh cuộc hội thoại hoặc cấu hình nhớ dài hạn.

**Chức năng chính:**

* Ghi nhớ ngữ cảnh phiên làm việc
* Lưu cấu hình ưu tiên
* Hỗ trợ hội thoại đa lượt

---

### 5.9 AI Log / AI Audit

**Mục tiêu:** Ghi lại hành vi của AI để kiểm soát chất lượng.

**Chức năng chính:**

* Log prompt
* Log response
* Log tool usage
* Log lỗi và cảnh báo
* Đánh giá chất lượng trả lời

---

## 6. Module hỗ trợ kỹ thuật

### 6.1 File Management

**Mục tiêu:** Quản lý file đính kèm trong hệ thống.

**Chức năng chính:**

* Upload file
* Lưu ảnh sản phẩm
* Lưu hóa đơn, phiếu sửa chữa
* Quản lý file hợp đồng hoặc chứng từ

---

### 6.2 Configuration Management

**Mục tiêu:** Quản lý cấu hình hệ thống.

**Chức năng chính:**

* Cấu hình giá trị mặc định
* Cấu hình chính sách
* Cấu hình môi trường
* Cấu hình AI và tích hợp

---

### 6.3 Cache Management

**Mục tiêu:** Tăng hiệu năng truy cập dữ liệu.

**Chức năng chính:**

* Cache dữ liệu tra cứu nhanh
* Cache session / token phụ trợ
* Cache thống kê phổ biến

---

### 6.4 Background Job / Scheduler

**Mục tiêu:** Xử lý tác vụ nền.

**Chức năng chính:**

* Đồng bộ dữ liệu
* Gửi thông báo định kỳ
* Re-index vector
* Job dọn dẹp log hoặc cache

---

### 6.5 System Health Monitoring

**Mục tiêu:** Theo dõi tình trạng vận hành hệ thống.

**Chức năng chính:**

* Health check
* Monitoring service
* Cảnh báo lỗi dịch vụ
* Theo dõi trạng thái AI, DB, Redis, Qdrant

---

## 7. Nhóm module theo mức độ ưu tiên

### Priority 1 – Bắt buộc cho MVP

* Authentication
* Authorization / RBAC
* User Management
* Branch Management
* Customer Management
* Product Management
* Inventory Management
* Sales / POS Management
* Invoice Management
* Payment Management
* Warranty Management
* Repair Management
* Reporting / Dashboard

### Priority 2 – Nên có trong giai đoạn đầu

* Role & Permission Management
* Category Management
* Brand Management
* Model / Variant Management
* Purchase / Import Management
* Promotion / Voucher Management
* Return / Exchange Management
* Audit Log
* Notification

### Priority 3 – Giai đoạn AI

* AI Assistant
* Knowledge Base
* RAG Service
* Vector Storage
* Embedding Service
* Prompt Management
* Tool Calling Service
* AI Memory
* AI Log / AI Audit

### Priority 4 – Hỗ trợ kỹ thuật

* File Management
* Configuration Management
* Cache Management
* Background Job / Scheduler
* System Health Monitoring

---

## 8. Quan hệ phụ thuộc giữa các module

* Authentication là nền tảng cho toàn bộ hệ thống
* Authorization phụ thuộc vào Role, Permission và User
* Branch Management ảnh hưởng đến hầu hết các module nghiệp vụ
* Product Management là đầu vào cho Inventory, Sales, Warranty, Repair
* Inventory Management phụ thuộc vào Product và Branch
* Sales / POS Management phụ thuộc vào Customer, Product, Inventory, Payment
* Warranty Management phụ thuộc vào Product, Invoice, Customer
* Repair Management phụ thuộc vào Customer, Product, Warranty
* Reporting / Dashboard lấy dữ liệu từ hầu hết module nghiệp vụ
* AI Assistant phụ thuộc vào dữ liệu từ các module nghiệp vụ, Knowledge Base và Tool Calling
* RAG Service phụ thuộc vào Embedding Service và Vector Storage
* Audit Log, Notification và Configuration là module hỗ trợ toàn hệ thống

---

## 9. Kết luận

Danh sách module này là khung phân rã ban đầu của hệ thống.
Nó được thiết kế để:

* Bảo đảm triển khai theo thứ tự hợp lý
* Giảm rủi ro khi phân tích và thiết kế database
* Tạo nền tảng rõ ràng cho kiến trúc phần mềm
* Giúp AI sinh code theo từng module một cách nhất quán

Tài liệu này sẽ được dùng làm đầu vào cho `SRS.md`, `WORKFLOW.md` và `ARCHITECTURE.md`.
