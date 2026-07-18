# BUSINESS_RULE

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0

---

# 1. Mục đích

Tài liệu này mô tả các quy tắc nghiệp vụ (Business Rules) của hệ thống.

Business Rule quy định:

* Dữ liệu nào được phép tạo.
* Điều kiện để thực hiện nghiệp vụ.
* Các ràng buộc của hệ thống.
* Các trường hợp ngoại lệ.

Các quy tắc này là cơ sở cho:

* Database Design
* API Validation
* Workflow
* AI Assistant
* Testing

---

# 2. Quy tắc chung

## BR-001 Mã định danh

Mỗi bản ghi chính trong hệ thống phải có một mã định danh duy nhất (UUID hoặc ID tự tăng tùy thiết kế).

---

## BR-002 Không xóa dữ liệu nghiệp vụ

Các dữ liệu đã phát sinh giao dịch (hóa đơn, phiếu sửa chữa, bảo hành...) không được xóa vật lý.

Chỉ được:

* Soft Delete
* Đánh dấu trạng thái ngừng sử dụng

---

## BR-003 Thời gian hệ thống

Mọi giao dịch phải lưu:

* Created At
* Updated At
* Created By
* Updated By

---

## BR-004 Audit Log

Mọi thao tác quan trọng đều phải ghi log.

Ví dụ:

* Đăng nhập
* Tạo hóa đơn
* Chỉnh sửa giá
* Điều chỉnh kho
* Đổi quyền
* AI Tool Calling

---

# 3. User & Permission Rules

## BR-101

Mỗi User chỉ có một tài khoản đăng nhập.

---

## BR-102

Tên đăng nhập không được trùng.

---

## BR-103

Email (nếu sử dụng) phải duy nhất.

---

## BR-104

Một User có thể thuộc một hoặc nhiều Role (tùy mô hình RBAC được chọn).

---

## BR-105

User chỉ được thao tác trong phạm vi quyền được cấp.

---

## BR-106

Tài khoản bị khóa không được phép đăng nhập.

---

## BR-107

Mọi thay đổi Role hoặc Permission phải được ghi Audit Log.

---

# 4. Branch Rules

## BR-201

Mỗi Branch có mã duy nhất.

---

## BR-202

Mỗi User chỉ thuộc một chi nhánh làm việc chính tại một thời điểm.

---

## BR-203

Dữ liệu của chi nhánh phải được tách biệt theo quyền truy cập.

---

## BR-204

Không được xóa chi nhánh đã phát sinh giao dịch.

---

# 5. Customer Rules

## BR-301

Khách hàng được xác định duy nhất bằng số điện thoại.

---

## BR-302

Không tạo khách hàng trùng số điện thoại.

---

## BR-303

Khách hàng có thể mua nhiều lần.

---

## BR-304

Khách hàng có nhiều phiếu bảo hành.

---

## BR-305

Khách hàng có nhiều phiếu sửa chữa.

---

# 6. Product Rules

## BR-401

Mỗi sản phẩm thuộc một Brand.

---

## BR-402

Mỗi sản phẩm thuộc một Category.

---

## BR-403

Mỗi sản phẩm thuộc một Model.

---

## BR-404

Mỗi IMEI chỉ tồn tại một lần trong toàn hệ thống.

---

## BR-405

Một IMEI chỉ được bán một lần.

---

## BR-406

Không cho phép chỉnh sửa IMEI sau khi đã nhập kho.

---

## BR-407

Giá bán phải lớn hơn hoặc bằng 0.

---

## BR-408

Giá nhập phải lớn hơn 0.

---

# 7. Inventory Rules

## BR-501

Không được xuất kho nếu tồn kho không đủ.

---

## BR-502

Mọi thay đổi tồn kho đều phải có chứng từ.

---

## BR-503

Chuyển kho phải thực hiện đồng thời:

* Xuất kho nguồn
* Nhập kho đích

---

## BR-504

Không được tồn tại số lượng âm.

---

## BR-505

IMEI chỉ tồn tại ở một chi nhánh tại một thời điểm.

---

## BR-506

Kiểm kho không được làm mất lịch sử giao dịch.

---

# 8. Purchase Rules

## BR-601

Phiếu nhập chỉ được tạo khi có nhà cung cấp hợp lệ.

---

## BR-602

Không nhập trùng IMEI.

---

## BR-603

Giá nhập phải lớn hơn 0.

---

# 9. Sales Rules

## BR-701

Chỉ bán sản phẩm đang còn trong kho.

---

## BR-702

Không bán sản phẩm đã bán.

---

## BR-703

Không bán sản phẩm đang sửa chữa.

---

## BR-704

Không bán sản phẩm đang bảo hành nội bộ.

---

## BR-705

Mỗi hóa đơn phải có ít nhất một sản phẩm hoặc dịch vụ.

---

## BR-706

Sau khi thanh toán thành công:

* Cập nhật tồn kho
* Cập nhật trạng thái IMEI
* Sinh hóa đơn
* Ghi lịch sử khách hàng

---

# 10. Payment Rules

## BR-801

Tổng tiền thanh toán phải bằng tổng giá trị hóa đơn.

---

## BR-802

Cho phép nhiều phương thức thanh toán trên cùng một hóa đơn.

---

## BR-803

Không được sửa hóa đơn đã thanh toán nếu không có quyền đặc biệt.

---

# 11. Warranty Rules

## BR-901

Chỉ sản phẩm đã bán mới được bảo hành.

---

## BR-902

Thời hạn bảo hành tính từ ngày bán.

---

## BR-903

Một sản phẩm có thể có nhiều lần bảo hành.

---

## BR-904

Bảo hành không làm thay đổi lịch sử bán hàng.

---

## BR-905

Nếu đổi máy:

* Máy cũ ngừng sử dụng.
* Máy mới kế thừa thông tin bảo hành theo chính sách.

---

# 12. Repair Rules

## BR-1001

Mỗi lần sửa chữa tạo một Repair Ticket.

---

## BR-1002

Repair Ticket có mã duy nhất.

---

## BR-1003

Máy đang sửa không được bán.

---

## BR-1004

Mọi thay đổi trạng thái sửa chữa phải được lưu lịch sử.

---

## BR-1005

Chỉ được bàn giao sau khi hoàn tất sửa chữa.

---

# 13. Promotion Rules

## BR-1101

Voucher chỉ áp dụng trong thời gian hiệu lực.

---

## BR-1102

Voucher hết hạn không được sử dụng.

---

## BR-1103

Không áp dụng nhiều voucher nếu chính sách không cho phép.

---

# 14. Dashboard Rules

## BR-1201

Dashboard chỉ hiển thị dữ liệu theo quyền người dùng.

---

## BR-1202

Doanh thu được tính từ hóa đơn đã thanh toán.

---

## BR-1203

Lợi nhuận dựa trên giá vốn và giá bán.

---

# 15. AI Rules

## BR-1301

AI chỉ được truy cập dữ liệu mà người dùng có quyền xem.

---

## BR-1302

AI không được tự ý sửa dữ liệu.

---

## BR-1303

Mọi thao tác cập nhật dữ liệu phải thông qua Tool Calling.

---

## BR-1304

AI không được thực hiện hành động nguy hiểm nếu chưa có xác nhận của người dùng.

Ví dụ:

* Xóa dữ liệu
* Hủy hóa đơn
* Điều chỉnh kho
* Đổi quyền

---

## BR-1305

AI phải ưu tiên trả lời dựa trên dữ liệu nội bộ trước kiến thức tổng quát.

---

## BR-1306

Nếu không có dữ liệu, AI phải thông báo không tìm thấy thay vì tự suy đoán.

---

# 16. File Rules

## BR-1401

Chỉ cho phép tải lên các định dạng được hệ thống hỗ trợ.

---

## BR-1402

Kích thước file phải nằm trong giới hạn cấu hình.

---

## BR-1403

File phải gắn với đúng thực thể nghiệp vụ.

Ví dụ:

* Product
* Repair Ticket
* Warranty
* Customer

---

# 17. Audit Rules

## BR-1501

Không được chỉnh sửa Audit Log.

---

## BR-1502

Audit Log chỉ được phép đọc bởi người có quyền.

---

# 18. System Rules

## BR-1601

Mọi transaction quan trọng phải thực hiện trong Transaction Database.

---

## BR-1602

Không được để dữ liệu ở trạng thái không nhất quán.

---

## BR-1603

Mọi API phải kiểm tra quyền trước khi xử lý.

---

## BR-1604

Các thao tác thất bại không được làm thay đổi dữ liệu.

---

# 19. Quy tắc ưu tiên

Khi có xung đột giữa các tài liệu, thứ tự ưu tiên áp dụng là:

1. BUSINESS_RULE.md
2. WORKFLOW.md
3. SRS.md
4. API Contract
5. Source Code

Nếu Source Code không tuân thủ Business Rule thì Business Rule được xem là đúng và Source Code phải được chỉnh sửa.

---

# 20. Kết luận

Business Rule là nền tảng của toàn bộ hệ thống. Mọi thiết kế Database, API, Workflow, AI Agent và kiểm thử đều phải tuân thủ các quy tắc trong tài liệu này.

Các Business Rule sẽ tiếp tục được mở rộng khi bổ sung nghiệp vụ mới nhưng phải đảm bảo tính nhất quán và không phá vỡ các quy tắc đã được xác lập.
