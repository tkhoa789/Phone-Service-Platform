# WORKFLOW

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Mục đích

Tài liệu này mô tả luồng xử lý nghiệp vụ của hệ thống.

Workflow là cơ sở để xây dựng:

* Sequence Diagram
* Activity Diagram
* API Design
* Backend Service
* AI Tool Calling
* Test Case

---

# 2. Quy ước

```
Actor
    ↓
Action
    ↓
Validation
    ↓
Business Process
    ↓
Database
    ↓
Response
```

Nếu Validation thất bại thì dừng Workflow và trả về lỗi.

---

# 3. Authentication Workflow

```
User

↓

Đăng nhập

↓

Kiểm tra Username

↓

Kiểm tra Password

↓

Kiểm tra trạng thái tài khoản

↓

Sinh JWT

↓

Sinh Refresh Token

↓

Ghi Audit Log

↓

Trả kết quả
```

---

# 4. Customer Workflow

```
Sales

↓

Nhập số điện thoại

↓

Khách hàng tồn tại?

├── Có
│      ↓
│   Lấy thông tin
│
└── Không
       ↓
   Tạo khách hàng mới

↓

Lưu thông tin

↓

Sẵn sàng bán hàng
```

---

# 5. Sales Workflow

```
Sales

↓

Tạo đơn hàng

↓

Chọn khách hàng

↓

Chọn sản phẩm

↓

Kiểm tra tồn kho

↓

Kiểm tra IMEI

↓

Áp dụng Voucher

↓

Tính tổng tiền

↓

Thanh toán

↓

Thanh toán thành công?

├── Không
│      ↓
│   Hủy giao dịch
│
└── Có
       ↓
    Sinh hóa đơn
       ↓
    Trừ tồn kho
       ↓
    Cập nhật IMEI
       ↓
    Sinh bảo hành
       ↓
    Ghi Audit Log
       ↓
    In hóa đơn
```

---

# 6. Inventory Workflow

```
Warehouse

↓

Tạo phiếu nhập

↓

Nhập IMEI

↓

Kiểm tra IMEI

↓

IMEI tồn tại?

├── Có
│      ↓
│    Báo lỗi
│
└── Không
       ↓
    Lưu dữ liệu

↓

Cập nhật tồn kho

↓

Ghi Audit Log
```

---

# 7. Transfer Inventory Workflow (Luân Chuyển Kho Theo Lô & Vận Chuyển Liên Chi Nhánh)

```
Warehouse Staff

↓

Tạo Phiếu Chuyển Kho Liên Chi Nhánh

↓

Chọn Kho Nguồn & Kho Đích

↓

Mở Modal "📦 Chọn Theo Lô Sản Phẩm" (Multi-Select Search Batch Modal)

↓

Tích chọn danh sách n mặt hàng & Tùy chỉnh số lượng luân chuyển từng loại

↓

Kiểm tra số lượng tồn kho khả dụng tại Kho Nguồn

↓

Đủ hàng?

├── Không
│      ↓
│   Cảnh báo không đủ tồn kho khả dụng
│
└── Có
       ↓
   Chọn Đơn vị Vận chuyển / Tài xế Shipper & Đóng gói niêm phong (Mốc 1: Draft / Locked)
       ↓
   Kho Nguồn tạm khóa / xuất tồn kho vật lý
       ↓
   Vận chuyển đường xa (Mốc 2: In-Transit / Shipping)
       ↓
   Kho Đích kiểm đếm số lượng thực nhận vs Phiếu chuyển
       ↓
   Kho Đích xác nhận Nhập Kho (Mốc 3: Completed / Received)
       ↓
   Tự động cộng tồn kho Kho Đích & Cập nhật vị trí chuỗi 15 số IMEI
       ↓
   Ghi Audit Log
```

---

# 8. Warranty Workflow

```
Warranty Staff

↓

Nhập IMEI

↓

Kiểm tra lịch sử bán

↓

Kiểm tra thời hạn bảo hành

↓

Còn bảo hành?

├── Không
│      ↓
│   Từ chối
│
└── Có
       ↓
   Tạo phiếu bảo hành
       ↓
   Kiểm tra chính sách
       ↓
   Sửa / Đổi máy
       ↓
   Hoàn tất
       ↓
   Ghi lịch sử
```

---

# 9. Repair Workflow

```
Technician / Receptionist

↓

Tiếp nhận máy

↓

Lập Bảng kiểm tra 8 chức năng (Pre-Repair 8-Point Checklist: Màn hình, Cảm ứng, FaceID, Camera, Loa/Mic, Sạc, Wifi, Thân vỏ)

↓

Ghi nhận mô tả lỗi & Mật khẩu mở máy

↓

In Phiếu Biên Nhận K80 (80mm) & Khách hàng ký tên xác nhận

↓

Khởi tạo tiến trình AppleCare Progress Stepper (Mốc 1: Received)

↓

Chẩn đoán kỹ thuật (Mốc 2: Diagnosing)

↓

Lập báo giá (Tiền công KTV + Linh kiện thay thế)

↓

Khách đồng ý?

├── Không
│      ↓
│   Hủy phiếu & Trả máy nguyên trạng
│
└── Có
       ↓
   Tiến hành sửa & Gán linh kiện thay thế (Mốc 3: Repairing)
       ↓
   Tự động xuất kho linh kiện từ Kho Chi Nhánh (Inventories -1)
       ↓
   Kiểm thử chất lượng QC (Mốc 4: Testing)
       ↓
   Hoàn tất & Sẵn sàng bàn giao (Mốc 5: Completed)
       ↓
   Bàn giao máy & Thu tiền còn lại
       ↓
   Ghi Audit Log
```

---

# 10. Return & Exchange Workflow

```
Sales

↓

Nhập hóa đơn

↓

Kiểm tra điều kiện đổi trả

↓

Đủ điều kiện?

├── Không
│      ↓
│   Từ chối
│
└── Có
       ↓
   Chọn sản phẩm đổi
       ↓
   Tính chênh lệch
       ↓
   Thu/Hoàn tiền
       ↓
   Cập nhật kho
       ↓
   Cập nhật hóa đơn
```

---

# 11. Dashboard Workflow

```
User

↓

Chọn Dashboard

↓

Kiểm tra quyền

↓

Lấy dữ liệu

↓

Tổng hợp KPI

↓

Tính doanh thu

↓

Tính lợi nhuận

↓

Hiển thị Dashboard
```

---

# 12. AI Assistant Workflow

```
User

↓

Gửi câu hỏi

↓

LLM

↓

Intent Detection

↓

Có cần Tool?

├── Không
│      ↓
│   Trả lời
│
└── Có
       ↓
Kiểm tra Permission
       ↓
Permission hợp lệ?

├── Không
│      ↓
│  Từ chối
│
└── Có
       ↓
Tool Calling
       ↓
Database/API
       ↓
RAG
       ↓
LLM
       ↓
Sinh câu trả lời
       ↓
Ghi AI Log
       ↓
Trả kết quả
```

---

# 13. Notification Workflow

```
Business Event

↓

Sinh Notification

↓

Lưu Database

↓

Push Notification

↓

Email (nếu có)

↓

Đánh dấu đã đọc
```

---

# 14. Quy tắc chung

* Mọi Workflow đều phải kiểm tra Permission trước khi thực hiện.
* Các giao dịch quan trọng phải sử dụng Database Transaction.
* Mọi thay đổi dữ liệu phải ghi Audit Log.
* AI chỉ được thao tác thông qua Tool Calling.
* Không được cập nhật trực tiếp Database từ AI.
* Khi có lỗi, hệ thống phải rollback toàn bộ transaction.

---

# 15. Mapping

| Workflow           | Module       |
| ------------------ | ------------ |
| Authentication     | Auth         |
| Customer           | Customer     |
| Sales              | Sales        |
| Inventory          | Inventory    |
| Transfer Inventory | Inventory    |
| Warranty           | Warranty     |
| Repair             | Repair       |
| Return & Exchange  | Sales        |
| Dashboard          | Dashboard    |
| AI Assistant       | AI           |
| Notification       | Notification |

---

# 16. Kết luận

Workflow là tài liệu mô tả luồng nghiệp vụ chuẩn của hệ thống. Mọi API, Service, Sequence Diagram, Test Case và AI Tool Calling đều phải tuân thủ các Workflow được định nghĩa trong tài liệu này để đảm bảo tính nhất quán giữa phân tích nghiệp vụ và triển khai kỹ thuật.
