# RISK_ANALYSIS

## 1. Mục đích

Tài liệu này xác định các rủi ro có thể xảy ra trong quá trình phân tích, thiết kế, phát triển, triển khai và vận hành hệ thống **Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant**.

Mục tiêu:

* Chủ động nhận diện rủi ro
* Đánh giá mức độ ảnh hưởng và khả năng xảy ra
* Đề xuất biện pháp giảm thiểu
* Làm cơ sở cho việc lập kế hoạch và quản lý dự án

---

# 2. Thang đánh giá

## 2.1 Mức độ ảnh hưởng (Impact)

| Mức      | Mô tả                                       |
| -------- | ------------------------------------------- |
| Low      | Ảnh hưởng nhỏ, không làm gián đoạn hệ thống |
| Medium   | Ảnh hưởng một phần chức năng                |
| High     | Ảnh hưởng nghiêm trọng đến hệ thống         |
| Critical | Có thể khiến hệ thống không thể hoạt động   |

---

## 2.2 Khả năng xảy ra (Probability)

| Mức      | Mô tả               |
| -------- | ------------------- |
| Rare     | Hiếm khi xảy ra     |
| Possible | Có khả năng xảy ra  |
| Likely   | Thường xuyên xảy ra |

---

# 3. Business Risks

## BR-01 Thiếu thống nhất quy trình giữa các chi nhánh

**Nguyên nhân**

* Mỗi cửa hàng vận hành theo cách khác nhau.

**Ảnh hưởng**

* Business Rule phức tạp.
* Khó chuẩn hóa workflow.

**Impact**

High

**Probability**

Likely

**Giảm thiểu**

* Chuẩn hóa quy trình ngay từ Phase 1.
* Workflow phải được phê duyệt trước khi thiết kế database.

---

## BR-02 Thay đổi yêu cầu giữa chừng

**Nguyên nhân**

* Phát sinh yêu cầu mới khi đang phát triển.

**Ảnh hưởng**

* Phải sửa database.
* Phải sửa API.
* Tăng chi phí.

**Impact**

High

**Probability**

Likely

**Giảm thiểu**

* Hoàn thiện SRS trước khi code.
* Áp dụng quy trình quản lý thay đổi (Change Request).

---

## BR-03 Sai Business Rule

**Nguyên nhân**

* Hiểu sai nghiệp vụ.

**Ảnh hưởng**

* Sai toàn bộ logic hệ thống.

**Impact**

Critical

**Probability**

Possible

**Giảm thiểu**

* Review Business Rule với từng workflow.
* Kiểm tra chéo với User Story và Use Case.

---

# 4. Database Risks

## DB-01 Thiết kế ERD chưa tối ưu

**Ảnh hưởng**

* Khó mở rộng.
* Dữ liệu dư thừa.
* Hiệu năng kém.

**Impact**

Critical

**Probability**

Possible

**Giảm thiểu**

* Chuẩn hóa dữ liệu đến 3NF.
* Review ERD trước khi tạo Migration.

---

## DB-02 Quản lý IMEI không chính xác

**Ảnh hưởng**

* Trùng thiết bị.
* Sai tồn kho.
* Sai bảo hành.

**Impact**

Critical

**Probability**

Possible

**Giảm thiểu**

* IMEI phải duy nhất.
* Kiểm tra tại tầng Database và Application.

---

## DB-03 Mất đồng bộ tồn kho

**Ảnh hưởng**

* Báo cáo sai.
* Bán vượt số lượng.

**Impact**

Critical

**Probability**

Possible

**Giảm thiểu**

* Sử dụng transaction.
* Kiểm soát đồng thời (Concurrency Control).
* Ghi nhận lịch sử biến động kho.

---

# 5. Technical Risks

## TC-01 Kiến trúc không đủ khả năng mở rộng

**Impact**

High

**Probability**

Possible

**Giảm thiểu**

* Áp dụng Clean Architecture.
* Thiết kế module độc lập.

---

## TC-02 API thay đổi nhiều

**Impact**

High

**Probability**

Likely

**Giảm thiểu**

* Thiết kế API Contract trước khi code.
* Tuân thủ versioning.

---

## TC-03 Hiệu năng truy vấn thấp

**Impact**

High

**Probability**

Possible

**Giảm thiểu**

* Thiết kế Index hợp lý.
* Sử dụng Redis Cache.
* Tối ưu truy vấn.

---

## TC-04 Lỗi phân quyền

**Impact**

Critical

**Probability**

Possible

**Giảm thiểu**

* RBAC rõ ràng.
* Kiểm tra quyền ở cả Backend và Frontend.

---

# 6. AI Risks

## AI-01 AI trả lời sai

**Nguyên nhân**

* Hallucination.
* Thiếu dữ liệu.

**Impact**

High

**Probability**

Likely

**Giảm thiểu**

* Áp dụng RAG.
* AI chỉ trả lời dựa trên dữ liệu được truy xuất.
* Hiển thị nguồn dữ liệu khi cần.

---

## AI-02 AI truy cập vượt quyền

**Impact**

Critical

**Probability**

Possible

**Giảm thiểu**

* AI sử dụng cùng cơ chế RBAC.
* Tool Calling luôn kiểm tra quyền người dùng.

---

## AI-03 Prompt Injection

**Impact**

Critical

**Probability**

Possible

**Giảm thiểu**

* Kiểm tra và lọc Prompt.
* Không cho AI thực thi lệnh trực tiếp.
* Chỉ cho phép gọi các Tool đã đăng ký.

---

## AI-04 Vector Database không đồng bộ

**Impact**

Medium

**Probability**

Possible

**Giảm thiểu**

* Re-index định kỳ.
* Theo dõi phiên bản dữ liệu.
* Đồng bộ khi tài liệu thay đổi.

---

# 7. Security Risks

## SE-01 SQL Injection

**Giảm thiểu**

* ORM.
* Prepared Statement.
* Validate Input.

---

## SE-02 XSS

**Giảm thiểu**

* Escape Output.
* Validate dữ liệu đầu vào.
* CSP nếu triển khai web.

---

## SE-03 CSRF

**Giảm thiểu**

* JWT.
* CSRF Token khi cần.

---

## SE-04 Mật khẩu yếu

**Giảm thiểu**

* BCrypt.
* Chính sách mật khẩu mạnh.
* Giới hạn số lần đăng nhập sai.

---

## SE-05 Rò rỉ dữ liệu

**Giảm thiểu**

* Phân quyền.
* Mã hóa dữ liệu nhạy cảm.
* Audit Log.

---

# 8. Infrastructure Risks

## INF-01 Docker cấu hình sai

**Ảnh hưởng**

Không thể triển khai.

**Giảm thiểu**

* Docker Compose chuẩn.
* Kiểm thử triển khai định kỳ.

---

## INF-02 PostgreSQL lỗi

**Giảm thiểu**

* Backup định kỳ.
* Replication nếu cần.
* Kiểm tra khôi phục dữ liệu.

---

## INF-03 Redis mất dữ liệu

**Giảm thiểu**

* Chỉ dùng Redis cho cache và session.
* Không lưu dữ liệu nghiệp vụ.

---

## INF-04 Ollama hoặc AI Service ngừng hoạt động

**Giảm thiểu**

* Tách AI Service khỏi Backend.
* Có cơ chế fallback khi AI không khả dụng.

---

# 9. Project Risks

## PJ-01 Chậm tiến độ

**Nguyên nhân**

* Thiếu tài liệu.
* Phạm vi thay đổi.

**Giảm thiểu**

* Hoàn thành đầy đủ tài liệu trước khi lập trình.
* Chia nhỏ module để phát triển.

---

## PJ-02 AI sinh code không đúng

**Nguyên nhân**

* Context không đầy đủ.

**Giảm thiểu**

* Xây dựng AI Context ở Phase 7.
* Review mã nguồn sau mỗi module.

---

## PJ-03 Thiếu tài liệu

**Giảm thiểu**

* Cập nhật tài liệu song song với quá trình phát triển.
* Mỗi Phase đều có Deliverable rõ ràng.

---

# 10. Risk Matrix

| ID    | Loại              | Impact   | Probability | Mức ưu tiên |
| ----- | ----------------- | -------- | ----------- | ----------- |
| BR-03 | Sai Business Rule | Critical | Possible    | Rất cao     |
| DB-02 | Sai quản lý IMEI  | Critical | Possible    | Rất cao     |
| DB-03 | Sai tồn kho       | Critical | Possible    | Rất cao     |
| TC-04 | Sai phân quyền    | Critical | Possible    | Rất cao     |
| AI-02 | AI vượt quyền     | Critical | Possible    | Rất cao     |
| AI-03 | Prompt Injection  | Critical | Possible    | Rất cao     |
| BR-02 | Thay đổi yêu cầu  | High     | Likely      | Cao         |
| TC-02 | API thay đổi      | High     | Likely      | Cao         |
| AI-01 | Hallucination     | High     | Likely      | Cao         |
| TC-03 | Hiệu năng         | High     | Possible    | Trung bình  |

---

# 11. Kế hoạch quản lý rủi ro

| Phase    | Hoạt động                               |
| -------- | --------------------------------------- |
| Phase 0  | Xác định rủi ro tổng quan               |
| Phase 1  | Kiểm tra Business Rule và Workflow      |
| Phase 2  | Review Database và ERD                  |
| Phase 3  | Review Architecture                     |
| Phase 4  | Kiểm tra API Contract                   |
| Phase 5  | Đánh giá AI Architecture và Prompt      |
| Phase 8  | Code Review từng module                 |
| Phase 11 | Kiểm thử và đánh giá lại toàn bộ rủi ro |

---

# 12. Kết luận

Rủi ro lớn nhất của dự án không nằm ở việc lập trình mà nằm ở **phân tích nghiệp vụ, thiết kế cơ sở dữ liệu và tích hợp AI**. Vì vậy, các phase đầu (Foundation, Business Analysis, Database Design và AI Design) cần được đầu tư kỹ lưỡng để giảm thiểu chi phí sửa đổi ở các giai đoạn sau.
