# BUSINESS RULE CHO AI

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 7 - AI Context

---

## Mục đích
Đây là phiên bản thu gọn và cụ thể hóa của tài liệu `BUSINESS_RULE.md` ở Phase 1, dành riêng cho mô hình ngôn ngữ (LLM) dùng để kiểm tra logic trước khi sinh code. Nếu code sinh ra vi phạm các luật dưới đây, code đó là sai.

## 1. Luật Tồn Kho & Bán hàng (Inventory & Sales)
* **Quy tắc xuất bán (BR-INV-01):** Số lượng trừ kho phải BẰNG số lượng trong đơn hàng. Không cho phép bán sản phẩm nếu tồn kho `<` số lượng mua. Throw exception ngay lập tức.
* **Quy tắc Giá (BR-SALE-02):** Giá bán chốt trên đơn hàng là giá tại thời điểm click tạo đơn, không bị ảnh hưởng nếu sau đó giá gốc của sản phẩm bị đổi trong database.
* **Số Seri/IMEI (BR-INV-03):** Sản phẩm điện thoại, laptop là hàng hóa có Serial/IMEI. Bắt buộc quản lý đích danh từng sản phẩm. Khi bán phải gắn đúng IMEI xuất kho vào chi tiết đơn hàng.

## 2. Luật Khách Hàng (Customer)
* **Định danh duy nhất:** Một số điện thoại chỉ thuộc về một khách hàng duy nhất. Nếu thêm mới bị trùng số điện thoại, throw `ConflictException`.
* **Phân hạng:** Hạng thẻ (Đồng, Bạc, Vàng, Kim Cương) được tính toán TỰ ĐỘNG thông qua Job (lịch trình) quét tổng chi tiêu, không được cho user update tay hạng thẻ.

## 3. Luật Bảo Hành & Sửa Chữa (Warranty & Repair)
* **Xác thực bảo hành:** Để tạo phiếu bảo hành MIỄN PHÍ, IMEI bắt buộc phải còn nằm trong thời hạn bảo hành tính từ `Ngày bán` (có trong hóa đơn mua hàng).
* **Luân chuyển trạng thái sửa chữa:** Phiếu sửa chữa chỉ được đi theo chiều tiến: `Tiếp nhận -> Chờ linh kiện -> Đang sửa -> Hoàn thành / Hủy`. Không cho phép lùi trạng thái (Ví dụ từ Hoàn thành quay về Đang sửa).

## 4. Ràng buộc Tool Calling của AI
* Bất cứ khi nào tạo hàm `@Tool` phục vụ việc CẬP NHẬT hoặc XÓA dữ liệu, AI phải thêm tham số bắt buộc kiểu boolean (vd: `isConfirmed`) hoặc thiết kế UI bắt user click nút thay vì AI tự động gọi trực tiếp (Human-in-the-loop).
