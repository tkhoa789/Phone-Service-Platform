# WIREFRAME DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 6 - UI Design

---

## 1. Triết lý Thiết kế (Design Philosophy)
* **Phong cách:** Clean UI, Modern, Minimalist. Sử dụng các component của thư viện UI như Ant Design, MUI, hoặc Shadcn UI.
* **Responsive:** Hỗ trợ tốt trên Desktop (màn hình máy tính tại quầy) và Tablet (nhân viên cầm iPad tư vấn tại cửa hàng). Mobile được tối ưu cho Dashboard quản lý.
* **Focus:** Giao diện tập trung vào dữ liệu và công cụ tìm kiếm, không dùng quá nhiều màu sắc sặc sỡ làm phân tâm nghiệp vụ.

## 2. Wireframe Khung Giao diện Chính (Main Layout Wireframe)

Giao diện chính được chia thành 3 phần cơ bản: Sidebar (Điều hướng), Header (Thông tin, Công cụ), và Main Content (Nội dung chính). Đặc biệt có thêm phần AI Assistant Sidebar.

```text
+-----------------------------------------------------------------------+
| [Logo]        | [Global Search]            | [User Profile] [🔔] [AI] |
|---------------+----------------------------+--------------------------|
| 🏠 Dashboard   |                                                      |
| 📦 Sản phẩm    |       NỘI DUNG MÀN HÌNH CHÍNH                        |
| 🛒 Đơn hàng    |       (Ví dụ: Bảng danh sách sản phẩm)               |
| 🔧 Bảo hành    |       + Lọc: [Danh mục v] [Trạng thái v]             |
| 👥 Khách hàng  |                                                      |
| ⚙️ Cài đặt     |       [Bảng dữ liệu DataGrid]                        |
|               |       - Mã SP | Tên SP | Tồn kho | Giá bán            |
|               |       - ...   | ...    | ...     | ...                |
|               |                                                      |
+---------------+-------------------------------------------------------+
```

## 3. Wireframe AI Assistant (Tích hợp sâu vào UI)

Khi nhân viên click vào nút [AI] trên Header, một Drawer (Sidebar trượt từ phải sang) sẽ hiện ra.

```text
+-----------------------------------------------------------------------+
|               |                                      | [AI] Chat      |
|               |                                      +----------------|
|               |                                      | AI: Chào bạn,  |
|               |                                      | tôi có thể giúp|
|               |       NỘI DUNG                       | gì hôm nay?    |
|               |       MÀN HÌNH CHÍNH                 |                |
|               |       (Bị làm mờ nhẹ                 | User: Tồn kho  |
|               |       hoặc đẩy sang trái)            | IP 15 Pro?     |
|               |                                      |                |
|               |                                      | AI: Tại kho Q1 |
|               |                                      | còn 5 cái.     |
|               |                                      |                |
|               |                                      | [ Nhập câu hỏi ]
+---------------+--------------------------------------+----------------+
```

## 4. UI Components đặc biệt của AI (Generative UI)
Không chỉ trả lời bằng text, AI có thể sinh ra các UI Components (Card, Button) ngay trong khung chat:

* **Action Card:** Nếu AI chuẩn bị tạo đơn hàng, nó không bắt user đọc JSON mà tạo một Card giao diện: 
  `[Đơn hàng: iPhone 15] - [Khách: Nguyen Van A] -> Nút [Duyệt tạo]`
* **Data Chart:** Nếu giám đốc hỏi "Doanh thu tháng này", AI gọi tool phân tích và nhúng thẳng một biểu đồ (Bar chart) vào trong bong bóng chat.
