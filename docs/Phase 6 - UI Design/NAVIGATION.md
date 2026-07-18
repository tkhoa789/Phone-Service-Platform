# NAVIGATION DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 6 - UI Design

---

## 1. Cấu trúc Điều hướng chính (Main Navigation)

Hệ thống sử dụng **Left Sidebar Navigation** làm trình điều hướng chính. Menu được render động dựa trên Role và Permission của nhân viên đăng nhập.

### 1.1 Cây thư mục Menu (Menu Tree)

```text
📌 TỔNG QUAN
 ├── 📊 Dashboard (Thống kê doanh thu, số lượng đơn)
 └── 🔔 Thông báo hệ thống

🛒 BÁN HÀNG
 ├── 🏷️ POS (Bán hàng tại quầy)
 ├── 📦 Đơn hàng trực tuyến (Xử lý đơn web)
 └── 🧾 Hóa đơn & Biên lai

📱 KHO & SẢN PHẨM
 ├── 📋 Danh mục sản phẩm (Quản lý Master data)
 ├── 🏢 Tồn kho (Theo chi nhánh)
 ├── 🚛 Chuyển kho nội bộ
 └── 🔍 Kiểm kê kho

🔧 DỊCH VỤ & BẢO HÀNH
 ├── 🛡️ Tra cứu bảo hành (Bằng IMEI/Serial)
 ├── 📝 Tiếp nhận sửa chữa
 └── ⚙️ Bàn giao kỹ thuật thuật

👥 QUẢN LÝ ĐỐI TÁC
 ├── 🧑‍🤝‍🧑 Khách hàng (Lịch sử, hạng thẻ)
 └── 🏭 Nhà cung cấp

⚙️ QUẢN TRỊ HỆ THỐNG (Dành cho Admin)
 ├── 👤 Phân quyền & Nhân viên
 ├── 🏪 Quản lý Chi nhánh
 └── 🤖 Quản lý AI & Tri thức (Nạp RAG)
```

## 2. Cơ chế Điều hướng Phụ (Sub-Navigation)
* **Breadcrumbs:** Luôn hiển thị ở góc trên bên trái của Main Content (Vd: `Trang chủ / Sản phẩm / iPhone 15 Pro Max / Chỉnh sửa`).
* **Tabs:** Khi vào một thực thể có nhiều quan hệ phức tạp (Ví dụ: Trang chi tiết Khách hàng), sử dụng Tabs để chuyển đổi thay vì scroll dài:
  `[Thông tin chung] | [Lịch sử mua hàng] | [Lịch sử bảo hành] | [Công nợ]`

## 3. Điều hướng Rảnh tay bằng AI (AI-Driven Navigation)
Một tính năng đột phá của hệ thống là khả năng AI điều hướng hộ người dùng (Deep Linking).

**Ví dụ:**
- User gõ vào AI: *"Mở trang cấu hình chi nhánh quận 1"*.
- AI Assistant hiểu được intent, thay vì trả lời bằng text, hệ thống UI sẽ bắt sự kiện (event) từ tin nhắn trả về của AI và tự động chuyển hướng (redirect) người dùng đến URL `/admin/branches/edit/UUID_QUAN_1`.
Điều này giảm tải việc phải nhớ menu phức tạp cho nhân viên mới.
