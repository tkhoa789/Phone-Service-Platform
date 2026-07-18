# GLOSSARY

## 1. Mục đích tài liệu

Tài liệu này dùng để chuẩn hóa các thuật ngữ nghiệp vụ và kỹ thuật xuất hiện trong dự án **Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant**.

Mục tiêu của tài liệu là:

* Giảm hiểu nhầm trong quá trình phân tích nghiệp vụ
* Thống nhất cách gọi giữa business, database, API và AI context
* Tạo nền tảng cho các tài liệu như `SRS.md`, `BUSINESS_RULE.md`, `WORKFLOW.md`, `ERD`, `ARCHITECTURE.md`

---

## 2. Danh sách thuật ngữ

### 2.1 Hệ thống / tổ chức

**Hệ thống**
Phần mềm tổng thể dùng để quản lý chuỗi cửa hàng điện thoại và các nghiệp vụ liên quan.

**Chuỗi cửa hàng**
Tập hợp nhiều chi nhánh thuộc cùng một đơn vị kinh doanh, dùng chung hệ thống quản lý.

**Chi nhánh (Branch)**
Một cửa hàng hoặc điểm bán cụ thể trong chuỗi, có thể có kho, nhân sự và doanh thu riêng.

**Người dùng (User)**
Tài khoản đăng nhập vào hệ thống, có thể là chủ cửa hàng, quản lý, nhân viên hoặc tài khoản hệ thống.

**Vai trò (Role)**
Nhóm quyền được gán cho người dùng, ví dụ: Admin, Manager, Sales, Technician, Warehouse Staff.

**Quyền (Permission)**
Quyền thao tác cụ thể trong hệ thống, ví dụ: tạo đơn hàng, sửa sản phẩm, xem báo cáo, duyệt bảo hành.

**Phân quyền (Authorization)**
Cơ chế kiểm soát người dùng được phép làm gì trong hệ thống.

**Xác thực (Authentication)**
Quá trình kiểm tra danh tính người dùng khi đăng nhập.

**RBAC**
Role-Based Access Control, mô hình phân quyền theo vai trò.

---

### 2.2 Khách hàng và bán hàng

**Khách hàng (Customer)**
Người mua sản phẩm hoặc sử dụng dịch vụ sửa chữa, bảo hành tại cửa hàng.

**Hồ sơ khách hàng**
Thông tin lưu trữ về khách hàng, bao gồm tên, số điện thoại, lịch sử mua hàng, sửa chữa và bảo hành.

**Đơn hàng (Order)**
Giao dịch bán hàng được tạo trong hệ thống trước khi xuất hóa đơn hoặc thanh toán.

**Hóa đơn (Invoice)**
Chứng từ ghi nhận giao dịch bán hàng chính thức.

**Chi tiết hóa đơn (Invoice Item)**
Danh sách sản phẩm/dịch vụ nằm trong một hóa đơn.

**Thanh toán (Payment)**
Quá trình khách hàng chi trả cho hóa đơn.

**Phương thức thanh toán (Payment Method)**
Cách thức thanh toán như tiền mặt, chuyển khoản, quẹt thẻ hoặc kết hợp nhiều hình thức.

**Khuyến mãi (Promotion)**
Chính sách giảm giá hoặc ưu đãi áp dụng cho sản phẩm, đơn hàng hoặc nhóm khách hàng.

**Voucher**
Mã giảm giá có điều kiện sử dụng.

**POS**
Point of Sale, khu vực hoặc chức năng bán hàng tại quầy.

---

### 2.3 Sản phẩm và hàng hóa

**Sản phẩm (Product)**
Hàng hóa được kinh doanh trong hệ thống.

**Danh mục (Category)**
Nhóm phân loại sản phẩm theo loại hình, ví dụ: điện thoại, phụ kiện, tablet, laptop.

**Thương hiệu (Brand)**
Nhà sản xuất hoặc thương hiệu của sản phẩm, ví dụ: Apple, Samsung, Xiaomi.

**Model**
Mẫu sản phẩm cụ thể theo thương hiệu.

**Biến thể (Variant)**
Phiên bản của cùng một model, khác nhau về màu sắc, dung lượng, cấu hình hoặc đặc điểm khác.

**Màu sắc (Color)**
Thuộc tính mô tả màu của sản phẩm.

**Dung lượng (Storage / Capacity)**
Thuộc tính mô tả bộ nhớ hoặc dung lượng lưu trữ của sản phẩm.

**IMEI**
Mã nhận dạng duy nhất của thiết bị di động, dùng để quản lý sản phẩm vật lý riêng lẻ.

**Serial Number**
Số seri của thiết bị hoặc linh kiện, dùng để nhận diện thiết bị.

**Trạng thái sản phẩm**
Tình trạng hiện tại của sản phẩm, ví dụ: mới, đã bán, đang bảo hành, đang sửa chữa, đã đổi trả.

---

### 2.4 Kho và tồn kho

**Kho (Inventory / Stock)**
Nơi lưu trữ hàng hóa của hệ thống tại một hoặc nhiều chi nhánh.

**Tồn kho (Stock Quantity)**
Số lượng sản phẩm còn có sẵn trong kho.

**Nhập kho (Import / Stock In)**
Nghiệp vụ đưa hàng hóa vào kho.

**Xuất kho (Export / Stock Out)**
Nghiệp vụ đưa hàng hóa ra khỏi kho.

**Chuyển kho (Stock Transfer)**
Di chuyển hàng hóa giữa các chi nhánh hoặc kho.

**Kiểm kho (Stock Count / Stocktaking)**
Đối chiếu số liệu tồn kho thực tế với số liệu trên hệ thống.

**Điều chỉnh kho (Stock Adjustment)**
Cập nhật lại số liệu kho khi phát hiện chênh lệch.

**Lô hàng (Stock Batch)**
Nhóm hàng hóa được nhập cùng đợt, thường có chung nguồn nhập hoặc chứng từ nhập.

**Nhà cung cấp (Supplier / Vendor)**
Đơn vị cung cấp hàng hóa cho cửa hàng.

---

### 2.5 Bảo hành

**Bảo hành (Warranty)**
Cam kết của cửa hàng hoặc nhà cung cấp về việc sửa chữa hoặc đổi sản phẩm trong một khoảng thời gian nhất định.

**Phiếu bảo hành**
Chứng từ ghi nhận thông tin và trạng thái bảo hành của sản phẩm.

**Kiểm tra bảo hành**
Nghiệp vụ xác định sản phẩm còn trong thời hạn bảo hành hay không.

**Tiếp nhận bảo hành**
Quá trình ghi nhận sản phẩm cần bảo hành từ khách hàng.

**Đổi máy**
Hành động thay thế thiết bị cũ bằng thiết bị khác theo chính sách bảo hành.

**Gia hạn bảo hành**
Kéo dài thời gian bảo hành theo chính sách áp dụng.

**Tình trạng bảo hành**
Trạng thái xử lý của yêu cầu bảo hành, ví dụ: mới tạo, đang xử lý, hoàn tất, từ chối.

---

### 2.6 Sửa chữa

**Sửa chữa (Repair)**
Quy trình tiếp nhận và xử lý thiết bị bị lỗi hoặc hư hỏng.

**Phiếu sửa chữa (Repair Ticket)**
Chứng từ ghi nhận yêu cầu sửa chữa của khách hàng.

**Lỗi thiết bị (Issue / Defect)**
Vấn đề hoặc hư hỏng được ghi nhận trên thiết bị.

**Chẩn đoán (Diagnosis)**
Bước kiểm tra để xác định nguyên nhân lỗi.

**Báo giá sửa chữa**
Chi phí dự kiến để sửa thiết bị.

**Tiến độ sửa chữa**
Trạng thái hiện tại của phiếu sửa chữa, ví dụ: tiếp nhận, chẩn đoán, đang sửa, chờ linh kiện, hoàn tất.

**Bàn giao máy**
Trả lại thiết bị cho khách hàng sau khi sửa xong.

---

### 2.7 Nhập hàng và nguồn cung

**Phiếu nhập hàng**
Chứng từ ghi nhận số lượng hàng nhập vào kho.

**Giá nhập**
Giá mua sản phẩm từ nhà cung cấp.

**Giá vốn**
Chi phí thực tế của sản phẩm dùng để tính lợi nhuận.

**Công nợ**
Số tiền còn phải thanh toán cho nhà cung cấp hoặc còn phải thu từ khách hàng tùy ngữ cảnh.

---

### 2.8 Báo cáo và điều hành

**Dashboard**
Màn hình tổng quan hiển thị các chỉ số quan trọng của hệ thống.

**Doanh thu (Revenue)**
Tổng giá trị bán hàng trong một khoảng thời gian.

**Lợi nhuận (Profit)**
Phần chênh lệch giữa doanh thu và chi phí.

**KPI**
Key Performance Indicator, chỉ số đánh giá hiệu quả hoạt động.

**Top sản phẩm**
Danh sách sản phẩm bán chạy hoặc mang lại doanh thu cao.

**Báo cáo tồn kho**
Báo cáo thể hiện số lượng hàng còn lại trong kho.

**Báo cáo chi nhánh**
Báo cáo tổng hợp hiệu quả hoạt động của từng chi nhánh.

---

### 2.9 AI và dữ liệu thông minh

**AI Assistant**
Trợ lý thông minh trong hệ thống, hỗ trợ tra cứu, phân tích, gợi ý và tự động hóa một phần thao tác nghiệp vụ.

**Prompt**
Câu lệnh hoặc nội dung đầu vào được gửi cho AI để tạo phản hồi hoặc thực hiện tác vụ.

**Agent**
Thành phần AI có khả năng quyết định cách xử lý yêu cầu bằng cách gọi công cụ hoặc truy xuất dữ liệu.

**Tool Calling**
Cơ chế cho phép AI gọi các chức năng bên ngoài như truy vấn database, tìm kiếm dữ liệu hoặc tạo báo cáo.

**RAG**
Retrieval-Augmented Generation, cơ chế kết hợp truy xuất tri thức và sinh câu trả lời từ AI.

**Embedding**
Biểu diễn số của văn bản để phục vụ tìm kiếm ngữ nghĩa.

**Vector DB**
Cơ sở dữ liệu lưu vector embedding để hỗ trợ truy xuất ngữ nghĩa.

**Knowledge Base**
Kho tri thức nội bộ gồm tài liệu nghiệp vụ, quy tắc và hướng dẫn sử dụng.

**Memory**
Thông tin ngữ cảnh hoặc dữ liệu ghi nhớ giúp AI duy trì hội thoại và phản hồi nhất quán.

**AI Context**
Tập hợp quy tắc, dữ liệu nền và hướng dẫn để AI sinh câu trả lời hoặc sinh code đúng yêu cầu.

---

### 2.10 Kỹ thuật hệ thống

**API**
Giao diện lập trình ứng dụng, cho phép các thành phần phần mềm giao tiếp với nhau.

**REST API**
Kiểu API phổ biến dựa trên HTTP và tài nguyên.

**Swagger / OpenAPI**
Công cụ và chuẩn mô tả API để dễ tài liệu hóa và kiểm thử.

**Backend**
Phần xử lý logic nghiệp vụ và dữ liệu của hệ thống.

**Frontend**
Phần giao diện người dùng.

**Database**
Nơi lưu trữ dữ liệu của hệ thống.

**Entity**
Đối tượng dữ liệu tương ứng với một bảng hoặc thực thể trong hệ thống.

**Relationship**
Quan hệ giữa các thực thể dữ liệu.

**Constraint**
Ràng buộc dữ liệu nhằm đảm bảo tính hợp lệ.

**Index**
Cấu trúc giúp tăng tốc truy vấn dữ liệu.

**Migration**
Quá trình quản lý thay đổi cấu trúc cơ sở dữ liệu theo phiên bản.

**Seed Data**
Dữ liệu khởi tạo cho hệ thống.

**Clean Architecture**
Kiến trúc phần mềm phân tầng rõ ràng, tách biệt nghiệp vụ, ứng dụng và hạ tầng.

**Module**
Khối chức năng độc lập của hệ thống.

---

## 3. Quy ước viết tắt

* **AI**: Artificial Intelligence
* **API**: Application Programming Interface
* **DB**: Database
* **ERD**: Entity Relationship Diagram
* **MVP**: Minimum Viable Product
* **POS**: Point of Sale
* **RBAC**: Role-Based Access Control
* **RAG**: Retrieval-Augmented Generation
* **UI**: User Interface
* **UX**: User Experience
* **JWT**: JSON Web Token
* **IMEI**: International Mobile Equipment Identity

---

## 4. Quy tắc sử dụng thuật ngữ

Để đảm bảo tính nhất quán trong toàn bộ dự án:

* Dùng cùng một thuật ngữ cho cùng một khái niệm trong mọi tài liệu
* Ưu tiên thuật ngữ tiếng Việt rõ nghĩa, kèm viết tắt tiếng Anh nếu cần
* Không dùng nhiều từ khác nhau để chỉ cùng một thực thể
* Mọi thuật ngữ trong API, database, UI và AI context phải khớp với glossary này
* Nếu có xung đột cách gọi, glossary này là tài liệu tham chiếu chuẩn

---

## 5. Kết luận

`GLOSSARY.md` là tài liệu chuẩn hóa ngôn ngữ cho toàn bộ dự án.
Khi các thuật ngữ đã được thống nhất, việc viết `BUSINESS_RULE.md`, `WORKFLOW.md`, `SRS.md` và thiết kế database sẽ chính xác và ít phải sửa đổi hơn.
