# 03.3 BUSINESS RULES & DOMAIN INVARIANTS

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

*Tài liệu tổng hợp 62 Quy tắc Nghiệp vụ Bất biến (Domain Invariants BR-001 đến BR-606) phục vụ thiết kế UI/UX, kiểm thực form và tích hợp Frontend-Backend.*

---

## 1. Nhóm 1: Quy tắc Chung & Định danh Hệ thống (BR-001 -> BR-008: 8 Rules)
* **BR-001 (Mã định danh duy nhất):** Mọi thực thể chính trong hệ thống đều sử dụng UUID (`Guid`) tuân thủ RFC 4122 v4 làm khóa chính.
* **BR-002 (Kỷ cương Xóa mềm - Soft Delete):** Dữ liệu giao dịch và Master Data không bao giờ bị xóa cứng (`DELETE`), mà cập nhật cờ `IsDeleted = true`.
* **BR-003 (Thời gian UTC chuẩn hóa):** Mọi mốc thời gian hệ thống ghi nhận (`CreatedAt`, `UpdatedAt`, `CompletedAt`) đều lưu trữ theo múi giờ UTC ISO 8601.
* **BR-004 (Định dạng Tiền tệ Quốc gia):** Tiền tệ lưu trữ dạng `decimal(18,2)`, hiển thị phía UI dưới dạng VNĐ có phân cách hàng nghìn (`1.000.000 ₫`).
* **BR-005 (Mã hóa Chứng từ Tự động):** Mã đơn hàng (`SO-`), hóa đơn (`INV-`), phiếu sửa chữa (`REP-`), phiếu bảo hành (`WAR-`), phiếu nhập kho (`PO-`) tự động sinh tiền tố + timestamp/số thứ tự.
* **BR-006 (Nguyên tắc Kiểm soát Lạc quan):** 13 thực thể trọng yếu sở hữu `RowVersion byte[]` ngăn chặn xung đột mất mát dữ liệu do ghi đè đồng thời (OCC).
* **BR-007 (Tính lũy kế Bất biến của Sổ cái):** Mọi biến động số dư kho hoặc điểm thành viên phải thông qua bản ghi lịch sử giao dịch (Transaction Log), cấm sửa đè số dư trực tiếp.
* **BR-008 (Khoanh vùng Chi nhánh - Branch Isolation):** Nhân viên thuộc chi nhánh nào chỉ được truy cập dữ liệu giao dịch phát sinh tại chi nhánh đó (ngoại trừ vai trò Owner, Admin).

---

## 2. Nhóm 2: Người Dùng, Phân Quyền & Xác Thực (BR-101 -> BR-108: 8 Rules)
* **BR-101 (7 Vai trò Chính quy):** Hệ thống chỉ công nhận 7 Canonical Roles: `Owner`, `Admin`, `Manager`, `Sales`, `Technician`, `Warranty`, `Inventory`.
* **BR-102 (Độ phức tạp Mật khẩu):** Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
* **BR-103 (Cơ chế Khóa tài khoản Tạm thời):** Đăng nhập sai quá 5 lần liên tiếp sẽ tự động khóa tài khoản trong 15 phút.
* **BR-104 (Vòng đời JWT & Refresh Token):** Access Token có hiệu lực 60 phút, Refresh Token có hiệu lực 7 ngày và bị thu hồi ngay khi đăng xuất.
* **BR-105 (Phân định 91 Quyền Hạt nhân):** Mọi API endpoint đều được bảo vệ bởi bộ 91 Permissions chi tiết thay vì kiểm tra Role chuỗi cứng.
* **BR-106 (Chính sách Một Chi nhánh Tác nghiệp):** Một nhân viên tại một thời điểm chỉ thuộc về một chi nhánh công tác mặc định.
* **BR-107 (Nhật ký Truy cập Toàn diện):** Ghi nhận địa chỉ IP, User-Agent, thời điểm và kết quả đăng nhập vào `LoginHistories`.
* **BR-108 (Nguyên tắc Bất khả xâm phạm của Super Admin):** Tài khoản Owner/Admin mặc định không thể bị vô hiệu hóa hoặc xóa bởi người dùng khác.

---

## 3. Nhóm 3: Sản Phẩm, Giá & Quản Lý Tồn Kho IMEI (BR-201 -> BR-212: 12 Rules)
* **BR-201 (Tính Hợp lệ Của Chuỗi IMEI):** IMEI phải đúng 15 chữ số thập phân tuân thủ thuật toán Luhn.
* **BR-202 (Định danh IMEI Duy nhất Toàn Cầu):** Mỗi mã IMEI chỉ được tồn tại một bản ghi duy nhất trong bảng `Imeis`.
* **BR-203 (Ma trận Vòng đời IMEI 6x6):** IMEI chỉ được chuyển đổi qua 6 trạng thái hợp lệ: `InStock`, `Sold`, `Repairing`, `WarrantyHold`, `Disposed`, `WrittenOff`.
* **BR-204 (Tính Bất biến của Trạng thái Cuối):** IMEI ở trạng thái `Disposed` (Thanh lý) hoặc `WrittenOff` (Xuất hủy) là trạng thái kết thúc, cấm chuyển đổi ngược lại.
* **BR-205 (Đồng bộ Tồn kho & Đếm Thực tế):** Số lượng tồn kho `Quantity` trong bảng `Inventories` phải luôn khớp chính xác với số lượng bản ghi IMEI có trạng thái `InStock` tại kho đó.
* **BR-206 (Cấm Xuất Âm Kho):** Không cho phép bất kỳ giao dịch xuất kho bán hàng hoặc chuyển kho nào làm số lượng tồn kho giảm xuống dưới 0.
* **BR-207 (Quy trình Điều chuyển Kho 2 Bước):** Xuất kho gửi (`InTransit`) -> Nhập kho nhận (`Received`). Hàng đang trên đường không thể đem bán.
* **BR-208 (Khóa Tồn kho Khi Kiểm kê - StockTake):** Khi bắt đầu phiên kiểm kê kho, hệ thống chụp snapshot tồn kho lý thuyết để đối chiếu chênh lệch.
* **BR-209 (Giá Bán Không Thấp Hơn Giá Vốn):** Giá niêm yết của biến thể sản phẩm không được nhỏ hơn giá vốn nhập hàng, trừ khi có phê duyệt khuyến mãi đặc biệt.
* **BR-210 (Mỗi Sản phẩm Tối thiểu Một Biến thể):** Một sản phẩm chính phải có ít nhất một biến thể (Variant) với SKU và giá cụ thể trước khi kích hoạt kinh doanh.
* **BR-211 (Tự động Cảnh báo Dưới Định mức Tồn):** Hệ thống phát tín hiệu cảnh báo khi số lượng tồn kho thấp hơn ngưỡng `MinStockLevel`.
* **BR-212 (Truy vết Thẻ kho Tức thời):** Mỗi lần xuất/nhập/điều chỉnh kho phải sinh một bản ghi `InventoryTransactions` kèm mã chứng từ gốc.

---

## 4. Nhóm 4: Bán Hàng POS & Khuyến Mãi (BR-301 -> BR-310: 10 Rules)
* **BR-301 (Idempotency 2 Tầng POS):** Mọi giao dịch tạo đơn hàng POS bắt buộc mang header `X-Idempotency-Key` để ngăn chặn thanh toán trùng lặp.
* **BR-302 (Chọn IMEI Bắt buộc cho Máy):** Khi bán sản phẩm có quản lý IMEI, nhân viên bán hàng bắt buộc phải quét/chọn đúng IMEI cụ thể trong kho.
* **BR-303 (Chuyển Trạng thái IMEI Sang Sold):** Ngay khi đơn hàng hoàn tất thanh toán (`Completed`), trạng thái IMEI lập tức đổi thành `Sold` và xóa liên kết kho.
* **BR-304 (Tích lũy Điểm Khách hàng Thân thiết):** Đơn hàng hoàn tất sẽ tự động tích lũy điểm thưởng cho khách hàng theo tỷ lệ cấu hình (ví dụ 100.000đ = 1 điểm).
* **BR-305 (Thăng Hạng Hội viên Tự động):** Khách hàng tích lũy đủ điểm chi tiêu sẽ được thăng hạng (`Standard`, `Silver`, `Gold`, `Platinum`) tương ứng.
* **BR-306 (Áp dụng Tối đa Một Voucher Mỗi Đơn):** Mỗi đơn hàng chỉ được sử dụng tối đa một mã giảm giá Voucher hợp lệ.
* **BR-307 (Ràng buộc Điều kiện Khuyến mãi):** Voucher chỉ có hiệu lực khi giá trị đơn hàng đạt mức tối thiểu và chưa vượt quá số lượt dùng cho phép.
* **BR-308 (Đa phương thức Thanh toán):** Hệ thống hỗ trợ chia nhỏ thanh toán một đơn hàng qua Tiền mặt, Thẻ POS, Chuyển khoản hoặc Điểm thưởng.
* **BR-309 (Không Thể Sửa Đơn Khi Đã Hoàn tất):** Đơn hàng ở trạng thái `Completed` là bất biến, muốn điều chỉnh phải thực hiện quy trình Đổi/Trả hàng.
* **BR-310 (Hoàn Tồn kho Khi Hủy Đơn):** Khi hủy đơn hàng chưa thanh toán, các IMEI đã giữ chỗ lập tức được hoàn trả về trạng thái `InStock`.

---

## 5. Nhóm 5: Dịch Vụ Sửa Chữa Kỹ Thuật (BR-401 -> BR-410: 10 Rules)
* **BR-401 (Kiểm định 8 Tiêu chí Tiếp nhận - CheckIn):** Khi nhận máy, kỹ thuật viên bắt buộc hoàn thành Checklist 8 điểm: Màn hình, Cảm ứng, FaceID/Vân tay, Camera, Loa/Mic, Sạc, Wifi, Vỏ máy.
* **BR-402 (Chuyển IMEI Sang Repairing):** Thiết bị nhận sửa chữa sẽ được cập nhật trạng thái IMEI sang `Repairing`.
* **BR-403 (Thu Tiền Đặt cọc Linh kiện):** Các ca sửa chữa thay thế linh kiện giá trị cao yêu cầu ghi nhận đặt cọc trước khi đặt linh kiện.
* **BR-404 (Xuất Linh kiện Gắn Liền Phiếu Sửa):** Linh kiện thay thế phải được xuất kho (`WriteOffPart`) gắn kèm mã phiếu sửa chữa `RepairTicketId`.
* **BR-405 (Chỉ Phân công Kỹ thuật viên Đủ Năng lực):** Phiếu sửa chữa chỉ được phân công cho nhân viên có vai trò `Technician`.
* **BR-406 (Khách hàng Phê duyệt Báo giá):** Nếu chi phí phát sinh vượt dự toán, hệ thống yêu cầu xác nhận phê duyệt từ khách hàng trước khi tiến hành sửa.
* **BR-407 (Quy trình 11 Bước Tuần tự FSM):** Phiếu sửa chữa tuân thủ nghiêm ngặt FSM: `PendingAssignment -> Received -> Diagnosing -> WaitingApproval -> WaitingForParts -> Repairing -> WaitingQC -> Completed -> WaitingPickup -> Delivered -> Cancelled`.
* **BR-408 (Kiểm định Chất lượng Xuất xưởng QC):** Trước khi bàn giao máy cho khách, kỹ thuật viên QC bắt buộc kiểm tra lại Checklist 8 điểm đạt yêu cầu.
* **BR-409 (Bảo hành Dịch vụ Sửa chữa):** Mọi linh kiện thay thế và công sửa chữa được tự động kích hoạt bảo hành dịch vụ 90 ngày kể từ ngày bàn giao.
* **BR-410 (Bàn giao và Quyết toán):** Khách hàng chỉ được nhận lại máy khi đã thanh toán toàn bộ chi phí sửa chữa còn lại.

---

## 6. Nhóm 6: Dịch Vụ Bảo Hành (BR-501 -> BR-508: 8 Rules)
* **BR-501 (Kiểm tra Thời hạn Bảo hành 12 Tháng):** Thiết bị chỉ được chấp nhận bảo hành nếu IMEI có đơn bán hàng hợp lệ trong vòng 12 tháng.
* **BR-502 (Chuyển IMEI Sang WarrantyHold):** Khi tiếp nhận bảo hành, IMEI của thiết bị lập tức đổi trạng thái sang `WarrantyHold`.
* **BR-503 (Xử lý 4 Nhánh Bảo hành):** Quy trình xử lý phân luồng thành 4 nhánh: Sửa chữa tại chỗ, Gửi hãng, Đổi máy mới, Từ chối bảo hành.
* **BR-504 (Hoán đổi IMEI Mới Khớp Kho):** Khi đổi máy mới, máy mới lập tức đổi trạng thái sang `Sold`, trừ tồn kho `Inventories` và ghi lịch sử thẻ kho.
* **BR-505 (Kế thừa Thời hạn Bảo hành Khi Đổi Máy):** Máy mới được đổi sẽ kế thừa thời gian bảo hành còn lại của máy cũ, cộng thêm tối thiểu 30 ngày gia hạn.
* **BR-506 (Lưu vết Lịch sử Đổi Máy):** Mọi giao dịch hoán đổi IMEI được ghi nhận đầy đủ vào `WarrantyHistories`.
* **BR-507 (Thẩm quyền Quyết định Đổi Máy):** Chỉ nhân viên có vai trò `Warranty`, `Manager` hoặc `Admin` mới có quyền phê duyệt đổi máy mới hoặc từ chối bảo hành.
* **BR-508 (Biên bản Bàn giao Bảo hành):** Khi trả máy bảo hành, hệ thống bắt buộc in biên bản xác nhận tình trạng hoạt động và chữ ký của khách hàng.

---

## 7. Nhóm 7: Báo Cáo, Kiểm Toán & Trợ Lý AI (BR-601 -> BR-606: 6 Rules)
* **BR-601 (Ghi log Kiểm toán Mọi Thao tác Ghi):** Toàn bộ các thao tác `POST`, `PUT`, `DELETE` làm biến động dữ liệu được ghi vào `AuditLogs` kèm Correlation ID.
* **BR-602 (Bảo mật Phạm vi Quyền AI):** Trợ lý AI chỉ được phép tra cứu dữ liệu trong phạm vi quyền hạn và chi nhánh của người dùng đang đăng nhập.
* **BR-603 (Ngăn chặn Rò rỉ Dữ liệu Nhạy cảm):** AI tự động che mờ (Masking) số điện thoại khách hàng, giá vốn sản phẩm và thông tin bảo mật khi hiển thị cho vai trò không có quyền.
* **BR-604 (Chống Prompt Injection Tự động):** Bộ lọc Guardrail chặn đứng các câu hỏi cố tình ép AI tiết lộ Prompt hệ thống hoặc thực thi mã độc hại.
* **BR-605 (RAG Grounding Chính xác Cao):** Trọng số ngữ cảnh RAG chỉ chấp nhận tài liệu có độ tương đồng Cosine >= 0.70 để triệt tiêu hiện tượng ảo giác (Hallucination).
* **BR-606 (Khóa Báo cáo Tài chính Theo Kỳ):** Báo cáo doanh thu và sổ sách kế toán của tháng trước sẽ tự động khóa sổ vào ngày mùng 5 của tháng tiếp theo.
