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

## BR-306 (Quy tắc Tích điểm Thưởng Loyalty PTS)

Điểm tích lũy (PTS) được tự động cộng khi Khách hàng hoàn tất thanh toán Hóa đơn bán hàng hoặc Hóa đơn sửa chữa:
* Tỷ lệ tích điểm: 10.000 VNĐ chi tiêu = 1 PTS (Tương đương 100.000 VNĐ = 10 PTS).
* Tỷ lệ tiêu điểm giảm giá tại POS: 1 PTS = 1.000 VNĐ giảm giá trực tiếp vào hóa đơn.
* **Quy tắc Thu hồi:** Nếu Hóa đơn hoặc Đơn hàng bị Hủy (Cancelled), hệ thống phải tự động **thu hồi lại** số Điểm thưởng (PTS) và Tổng chi tiêu (Total Spent) đã cộng tương ứng để chống trục lợi.

---

## BR-307 (Quy tắc Phân hạng Hội viên Tự động Theo Chi Tiêu)

Hồ sơ Khách hàng (CustomerEntity) bắt buộc phải có trường **Hạng thành viên (MemberTier)**. Hạng thành viên được hệ thống tự động tính toán và nâng hạng dựa trên Tổng chi tiêu tích lũy (hoặc Quy đổi 10.000 VNĐ = 1 PTS):
* 🥉 Hạng Đồng (Bronze): Tổng chi tiêu dưới 5.000.000 VNĐ (0 - 500 PTS).
* 🥈 Hạng Bạc (Silver): Tổng chi tiêu từ 5.000.001 VNĐ đến 20.000.000 VNĐ (501 - 2.000 PTS).
* 🥇 Hạng Vàng (Gold): Tổng chi tiêu từ 20.000.001 VNĐ đến 70.000.000 VNĐ (2.001 - 7.000 PTS).
* 👑 Hạng Kim Cương (Diamond): Tổng chi tiêu từ 70.000.001 VNĐ trở lên (Trên 7.000 PTS).

---

## BR-308 (Quyền lợi Hạng VIP & Bảo lưu Điểm)

* Hạng Bạc: Giảm 2% tiền công sửa chữa.
* Hạng Vàng: Giảm 5% tiền công sửa chữa & Ưu tiên tiếp nhận kỹ thuật.
* Hạng Kim Cương: Giảm 10% tiền công sửa chữa & Miễn phí gói bảo hành VIP Care 1-đổi-1.
* Điểm tích lũy được bảo lưu vĩnh viễn cho đến khi khách hàng sử dụng trừ tiền hóa đơn.

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

## BR-407 (Quy tắc In Tem Mã Vạch / Barcode QR Label)

Mỗi biến thể SKU phải hỗ trợ tạo tem mã vạch tiêu chuẩn Code-128 / QR Code và xuất lệnh in tem nhãn trực tiếp tới máy in tem nhiệt chuyên dụng (Xprinter / Zebra) với kích thước khổ tem tùy chỉnh (50x30mm, 35x22mm, A4 Sheet).

---

## BR-408 (Quy tắc Tự động Tính Tỷ Suất Lợi Nhuận Gộp)

Giao diện Khai báo biến thể SKU phải tự động tính toán và hiển thị trực tiếp Tỷ suất Lợi nhuận gộp (Gross Profit Margin %) theo công thức `Margin % = ((SalePrice - CostPrice) / SalePrice) * 100%` để quản lý kiểm soát biên độ lợi nhuận bán lẻ.

---

## BR-409

Giá bán phải lớn hơn hoặc bằng 0.

---

## BR-410 (Quy tắc Tìm Kiếm Danh Mục & Thương Hiệu Trên Modal Tạo Sản Phẩm)

Màn hình Khai Báo Dòng Sản Phẩm Mới phải tích hợp công cụ Tìm kiếm SearchableSelect cho cả 2 trường Danh mục Thiết bị (Category) và Thương hiệu Sản xuất (Brand).

---

## BR-411 (Quy tắc Gợi Nhớ Tên Mẫu Sản Phẩm & Quét Mã Vạch Hãng Tự Điền)

1. Tên dòng sản phẩm (Model Name) phải lưu giữ lịch sử tên các dòng máy từng nhập thủ công trước đây (như iPhone 15 Pro, Samsung S24) và tự động hiển thị gợi nhớ Autocomplete Dropdown khi gõ phím để nhân viên dễ dàng thay đổi số model (như iPhone 17).
2. Tích hợp tính năng Quét mã vạch nhà phân phối/hãng sản xuất (Manufacturer Barcode Scanner Auto-Fill) để tự động nhận diện thương hiệu, danh mục và tên sản phẩm gốc.

---

## BR-412 (Quy tắc Cơ Chế Kép Quét Mã Vạch Súng Bán Hàng & Camera Điện Thoại)

Màn hình Khai báo Sản phẩm phải tích hợp cơ chế nhận diện Kép:
1. **Auto-Focus Súng Quét Tít Còi (Physical Laser Barcode Gun):** Tự động đặt con trỏ chuột Auto-Focus vào ô mã vạch ngay khi mở Modal để nhân viên chĩa súng bắn tít còi là hệ thống tự động điền trong 0.05 giây mà không cần chạm chuột.
2. **Camera Điện Thoại / Máy Tính Bảng (Mobile Cam QR Scan):** Bổ sung nút bấm `📷 Bật Cam ĐT` kích hoạt camera thiết bị di động để quét mã QR/Barcode di động.

---

## BR-413 (Quy tắc Fallback Sang Ollama AI + Qdrant Vector Knowledge RAG)

Khi súng quét bắn mã vạch chưa có sẵn trong cơ sở dữ liệu hệ thống cục bộ:
1. Hệ thống tự động chuyển tiếp ngầm yêu cầu tra cứu sang **Ollama AI + Qdrant Vector Database RAG Engine**.
2. Ollama AI thực hiện suy luận RAG truy vấn kho tri thức EAN/GTIN quốc tế để trích xuất Thương hiệu (*Nintendo, Sony, Google Pixel, Asus ROG...*), Danh mục, Mã sản phẩm và Tên dòng máy trong thời gian dưới **0.8 giây**.
3. Tự động điền đầy đủ các ô dữ liệu và hiển thị Badge bảo chứng `🤖 Ollama AI + Qdrant Vector (0.8s)`.

---

## BR-414

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

## BR-507

Giao diện Quản lý Kho phải hỗ trợ lọc tồn kho theo từng Kho Chi Nhánh cụ thể và tích hợp bộ lọc nhanh 1-click hiển thị các sản phẩm có tồn kho dưới định mức tối thiểu (Minimum Stock Alert).

---

## BR-508

Thao tác luân chuyển kho liên chi nhánh (Inter-Branch Transfer) phải kiểm tra số lượng điều chuyển không vượt quá tồn kho khả dụng tại Kho Nguồn và cập nhật vị trí quản lý kho của thiết bị.

---

## BR-509 (Quy tắc Chọn Sản Phẩm Theo Lô)

Màn hình Tạo Phiếu Luân Chuyển Kho phải tích hợp Cửa sổ Chọn Sản Phẩm Theo Lô (Batch Product Selection Modal) cho phép tìm kiếm, tích chọn đồng thời nhiều mặt hàng và tùy chỉnh số lượng luân chuyển từng loại.

---

## BR-510 (Quy trình Vận Chuyển & Giao Hàng Liên Chi Nhánh)

Quy trình luân chuyển kho thực tế phải trải qua Pipeline Vận chuyển 3 bước:
1. Mốc 1 (Draft / Locked): Kho Nguồn lập phiếu, đóng gói thùng niêm phong và tạm khóa tồn kho khả dụng.
2. Mốc 2 (In-Transit / Shipping): Bàn giao đơn vị vận chuyển / Shipper nội bộ (ghi nhận tên tài xế & biển số xe) và chuyển hàng đi xa.
3. Mốc 3 (Completed / Received): Thủ kho Kho Đích mở thùng kiểm đếm thực tế vs Phiếu chuyển, bấm xác nhận nhập kho để tự động tăng số lượng tồn kho Kho Đích.

---

## BR-511 (Sổ Tra Cứu Phiếu Chuyển Kho & Hành Trình Tài Xế)

Giao diện Quản lý Kho phải tích hợp Sổ Tra Cứu Phiếu Chuyển Kho (Transfer Tracker Modal) cho phép tìm kiếm theo mã phiếu, tên tài xế, SĐT, biển số xe và bấm nút **"📥 Kho Đích Xác Nhận Đã Nhận Đủ Hàng"** để chốt phiếu và tự động cộng tồn kho vào Kho Đích.

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

## BR-604 (Sổ Giao Dịch & Lịch Sử Công Nợ AP Nhà Cung Cấp)

Mỗi biến động công nợ mua hàng (Nhập hàng tăng nợ `INVOICE`, Thanh toán trả tiền giảm nợ `PAYMENT`, Trả hàng lỗi giảm nợ `DEBIT_NOTE`) phải được ghi nhận tự động vào Sổ Giao Dịch Công Nợ (`SupplierDebtTransactions`) và tính toán số dư nợ dồn lũy kế (`BalanceAfter`) tại từng mốc thời gian.

---

## BR-605 (Phiếu Chi Thanh Toán Nợ Nhà Cung Cấp)

Giao diện Quản lý Nhà Cung Cấp phải tích hợp Cửa sổ Lập Phiếu Chi Thanh Toán Nợ (`SupplierPaymentModal`) cho phép nhập số tiền thanh toán (trả toàn bộ hoặc một phần), chọn phương thức (Tiền mặt, VietQR Chuyển khoản, Ủy nhiệm chi) và mã chứng từ. Khi bấm xác nhận chi, hệ thống tự động trừ dư nợ `DebtAmount` trong cơ sở dữ liệu realtime và tạo phiếu chi kế toán.

---

## BR-606 (Hạn Mức Tín Dụng & Cảnh Báo Tuổi Nợ AP)

Mỗi Nhà cung cấp được quản lý theo Hạn Mức Nợ Tối Đa (Credit Limit, mặc định 500M ₫) và Kỳ Hạn Thanh Toán (Credit Term Days, mặc định 30 ngày). Hệ thống phải tự động kiểm tra và hiển thị Badge cảnh báo màu đỏ `⚠️ Vượt Hạn Mức Nợ` hoặc `⏰ Quá Hạn` khi dư nợ vượt hạn mức hoặc quá ngày hẹn thanh toán.

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

## BR-707

Màn hình Bán hàng POS phải hỗ trợ lưu giữ và chuyển đổi nhiều Tab Đơn Hàng Nháp (Draft Carts Multi-Tab) đồng thời tại quầy.

---

## BR-708

Dữ liệu đơn nháp tại màn hình POS phải được duy trì liên tục qua các lần tải lại trang (localStorage persistence).

---

## BR-709

Khung hiển thị POS và các thành phần giao diện phải tự động điều chỉnh tỷ lệ (Fluid Auto-Scaling) khi người dùng thu phóng trình duyệt native (Ctrl + / Ctrl -) mà không làm lệch hay trôi lề.

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

## BR-906

Cổng tra cứu Bảo hành Điện tử (Electronic Warranty Verification Portal) chuẩn AppleCare+ / Samsung Care+ phải hiển thị thời hạn bảo hành còn lại (Countdown Days), Gói bảo hành (VIP Care 1-Đổi-1 / Standard Care), Hóa đơn mua gốc, Chi nhánh xuất bán và hỗ trợ in Thẻ Bảo Hành Điện Tử.

---

## BR-907

Khi thực hiện đổi máy 1-đổi-1 theo quy tắc BR-905, số IMEI máy cũ bị vô hiệu hóa và số IMEI máy mới kế thừa trọn vẹn thời hạn bảo hành còn lại của hóa đơn mua hàng gốc.

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

## BR-1006

Phải lập Bảng kiểm tra 8 chức năng (Pre-Repair 8-Point Function Checklist: Màn hình, Cảm ứng, FaceID/TouchID, Camera, Loa/Mic, Sạc/Pin, Wifi/SIM, Thân vỏ) trước khi tiếp nhận máy sửa để chống tranh chấp.

---

## BR-1007

Khi gán linh kiện thay thế vào phiếu sửa chữa, hệ thống tự động xuất kho linh kiện từ kho chi nhánh tiếp nhận và tính toán Tổng tiền = Tiền công KTV + Tổng giá bán các linh kiện thay thế.

---

## BR-1008

Nếu phiếu sửa chữa bị Hủy, toàn bộ linh kiện thay thế đã chọn phải tự động được hoàn trả lại kho chi nhánh.

---

## BR-1009

Mọi phiếu sửa chữa phải hỗ trợ xem và in Biên nhận K80 khổ 80mm có đầy đủ mã phiếu, ngoại quan, tiền cọc và chữ ký xác nhận của hai bên.

---

## BR-1010

Cung cấp tính năng tra cứu tiến độ sửa chữa chuẩn AppleCare / Samsung Smart Service qua 5 mốc trạng thái tiến trình (Tiếp nhận ➔ Chẩn đoán ➔ Sửa chữa ➔ QC ➔ Bàn giao).

---

## BR-1011 (Quy tắc Thanh Toán Phiếu Sửa Chữa)

Phiếu sửa chữa khi chuyển sang trạng thái Hoàn thành (Completed) bắt buộc phải sinh ra **Hóa đơn tài chính (Invoice)** tương ứng để tiến hành thanh toán. Khách hàng chỉ được tích điểm thưởng (RewardPoints) sau khi Hóa đơn này được thanh toán đủ (Paid). Mọi phiếu sửa chữa đã hoàn thành không được phép bàn giao nếu chưa hoàn tất Hóa đơn.

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

## BR-1104

Voucher phát hành trực tiếp không gắn mã Chương trình Khuyến mãi sẽ tự động liên kết với Chương trình Khuyến mãi Hệ thống Mặc định (GENERAL_PROMO). Hạn sử dụng của Voucher được tính trọn vẹn đến thời điểm cuối ngày (23:59:59).

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

Mọi API phải kiểm tra quyền (Authorization) trước khi xử lý. Bắt buộc phải sử dụng thuộc tính `[Authorize]` trên tất cả Controller hoặc Endpoint, trừ khi API đó được thiết kế công khai (Public) một cách có chủ đích (ví dụ: Đăng nhập).

---

## BR-1605 (RBAC - Role-Based Access Control)

Hệ thống phải thực thi kiểm soát truy cập dựa trên vai trò (RBAC). Các API nhạy cảm (tạo, sửa, xóa, truy cập dữ liệu quan trọng) phải kiểm tra quyền cụ thể của người dùng, không được phép áp dụng chính sách "cào bằng" quyền hạn sau khi đăng nhập thành công.

---

## BR-1604

Các thao tác thất bại không được làm thay đổi dữ liệu.

---

## BR-1606 (Optimistic Concurrency - Khóa Lạc Quan)

Các nghiệp vụ nhạy cảm về tài chính hoặc số lượng tồn kho (Thanh toán Invoice, Xử lý bảo hành Warranty, Nhập xuất Kho, Cập nhật trạng thái sửa chữa) bắt buộc phải sử dụng cơ chế Khóa lạc quan (Optimistic Concurrency) thông qua trường `RowVersion` ở cơ sở dữ liệu. Nếu hệ thống phát hiện phiên bản dữ liệu đã bị thay đổi bởi người dùng khác, phải từ chối thao tác và ném lỗi `CONCURRENCY_ERROR` để tránh thất thoát hoặc ghi đè dữ liệu sai lệch.

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
