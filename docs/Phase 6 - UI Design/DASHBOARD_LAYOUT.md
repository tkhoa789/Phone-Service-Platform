# DASHBOARD LAYOUT DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 6 - UI Design

---

## 1. Khái quát chung
Dashboard là màn hình hiển thị đầu tiên khi user đăng nhập. Layout của dashboard không cố định mà thay đổi (Dynamic Layout) tùy thuộc vào vai trò (Role) của người sử dụng nhằm cung cấp các chỉ số (KPIs) quan trọng nhất.

## 2. Bố cục theo Vai trò (Role-based Layouts)

### 2.1 Dashboard Dành cho Giám đốc / Quản lý cấp cao (Store Manager)
Tập trung vào phân tích vĩ mô, doanh thu và rủi ro.

* **Top Bar (Summary Widgets):**
  * Tổng doanh thu (Ngày/Tuần/Tháng).
  * Lợi nhuận gộp ước tính.
  * Số lượng đơn vị bán ra (Units Sold).
  * Số ca sửa chữa/bảo hành tiếp nhận mới.
* **Main Area (Charts):**
  * Biểu đồ cột (Bar Chart) doanh thu so sánh giữa các chi nhánh.
  * Biểu đồ đường (Line Chart) xu hướng bán hàng trong 30 ngày.
* **Bottom Area (Top/Worst lists):**
  * Top 5 sản phẩm bán chạy nhất.
  * Danh sách hàng tồn kho cận hạn / lưu kho quá lâu (Dead stock).

### 2.2 Dashboard Dành cho Nhân viên Bán hàng (Sales Staff)
Tập trung vào thực thi, thao tác nhanh và target cá nhân.

* **Top Bar:**
  * Doanh số cá nhân hôm nay.
  * % Hoàn thành chỉ tiêu (KPI) tháng.
* **Main Area:**
  * Danh sách đơn hàng cá nhân đang xử lý (Chờ thanh toán, chờ giao).
  * Lịch nhắc nhở (VD: Gọi điện chăm sóc khách hàng VIP hôm nay).
* **Quick Actions (Nút bấm to, dễ chạm):**
  * [Tạo đơn hàng mới]
  * [Tra cứu tồn kho nhanh]
  * [Tạo khách hàng mới]

### 2.3 Dashboard Dành cho Kỹ thuật viên (Technician)
Tập trung vào hàng đợi công việc.

* **Top Bar:**
  * Số máy đang chờ sửa.
  * Số máy hoàn thành trong ca làm việc.
* **Main Area (Kanban Board):**
  * Cột 1: Chờ kiểm tra.
  * Cột 2: Đang chờ linh kiện.
  * Cột 3: Đang sửa chữa.
  * Cột 4: Đã hoàn thành, chờ khách lấy.
  (Drag & drop các phiếu sửa chữa qua lại giữa các cột).

## 3. Sự hiện diện của AI trên Dashboard
Tại màn hình Dashboard của Quản lý, AI cung cấp một module **"AI Insights"**:
* Thay vì chỉ hiển thị biểu đồ, AI sẽ chạy job phân tích nền (Cronjob kết hợp LangChain) và đưa ra cảnh báo dạng văn bản:
  * *"AI Insight: Tồn kho iPhone 15 tại Chi nhánh Q1 đang thấp hơn mức an toàn, dự kiến sẽ hết hàng trong 3 ngày tới nếu tốc độ bán hiện tại giữ nguyên."*
  * Có kèm nút bấm: **[Tạo phiếu chuyển kho ngay]** để Quản lý thao tác lập tức.
