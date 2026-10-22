using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Qdrant.Client;
using PSP.Application.Common.Interfaces;

namespace PSP.Infrastructure.Services.AI;

public class AIKnowledgeSeeder
{
    private readonly IStoreAssistant _storeAssistant;
    private readonly QdrantClient _qdrantClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AIKnowledgeSeeder> _logger;
    private readonly string _collectionName;

    public AIKnowledgeSeeder(
        IStoreAssistant storeAssistant,
        QdrantClient qdrantClient,
        IConfiguration configuration,
        ILogger<AIKnowledgeSeeder> logger)
    {
        _storeAssistant = storeAssistant;
        _qdrantClient = qdrantClient;
        _configuration = configuration;
        _logger = logger;
        _collectionName = configuration["AiSettings:QdrantCollection"] ?? "psp_knowledge_base";
    }

    /// <summary>
    /// Gieo 4 tài liệu tri thức chính sách cơ sở vào Qdrant Vector DB.
    /// Thiết kế Idempotent & Fail-Safe: Chống Vector Bloat và không làm sập ứng dụng nếu Qdrant offline.
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("🚀 Kiểm tra trạng thái Qdrant Vector DB ({Collection})...", _collectionName);

            // 🛡️ CHỐT CHẶN TỬ HUYỆT 2 (CHỐNG VECTOR BLOAT):
            // Kiểm tra xem collection đã tồn tại và đã có vectors chưa. Nếu đã có dữ liệu -> Bỏ qua ngay!
            var exists = await _qdrantClient.CollectionExistsAsync(_collectionName, cancellationToken);
            if (exists)
            {
                var info = await _qdrantClient.GetCollectionInfoAsync(_collectionName, cancellationToken);
                if (info.PointsCount > 0)
                {
                    _logger.LogInformation("ℹ️ Qdrant Vector DB đã chứa {Count} điểm tri thức sẵn có. Bỏ qua bước gieo lại dữ liệu.", info.PointsCount);
                    return;
                }
            }

            _logger.LogInformation("📥 Bắt đầu nạp 4 bộ tài liệu chính sách cơ sở vào Qdrant Vector DB...");

            // 1. Chính sách bảo hành & đổi trả
            await _storeAssistant.IngestDocumentAsync(
                "Chính sách bảo hành và đổi trả thiết bị",
                @"Quy định bảo hành và đổi trả tại hệ thống PSP:
1. Thiết bị điện thoại mới chính hãng được bảo hành 12 tháng phần cứng theo tiêu chuẩn nhà sản xuất.
2. Chính sách 1 đổi 1 trong vòng 30 ngày đầu tiên nếu máy phát sinh lỗi từ nhà sản xuất (nguồn, màn hình, sóng).
3. Từ chối bảo hành đối với các trường hợp: máy bị rơi vỡ cấn móp, biến dạng khung vỏ, có dấu hiệu tiếp xúc chất lỏng (vào nước), rách tem niêm phong hoặc tự ý can thiệp phần mềm (root, unlock bootloader).
4. Linh kiện sửa chữa thay thế (Pin, Màn hình, Cụm sạc) được bảo hành từ 6 đến 12 tháng tùy loại.",
                "POLICY_WARRANTY",
                cancellationToken);

            // 2. Quy trình tiếp nhận & sửa chữa
            await _storeAssistant.IngestDocumentAsync(
                "Quy trình tiếp nhận và sửa chữa thiết bị",
                @"Quy trình 5 bước sửa chữa chuẩn hóa tại PSP:
Bước 1 - Tiếp nhận & Kiểm tra: Kỹ thuật viên kiểm tra 15 điểm chức năng ngoại quan cùng khách hàng, lập biên bản tiếp nhận ghi rõ hiện trạng máy và tiền cọc nếu có.
Bước 2 - Ký tên niêm phong: Khách hàng ký tên trực tiếp lên màn hình, pin, bo mạch chính trước khi kỹ thuật viên mở máy.
Bước 3 - Báo giá minh bạch: Cửa hàng liên hệ thông báo chẩn đoán chính xác và báo giá trọn gói (đã gồm công thợ), không phát sinh phụ phí.
Bước 4 - Sửa chữa & Kiểm thử: Thực hiện thay thế linh kiện chính hãng và chạy bài kiểm tra chất lượng (QC checklist).
Bước 5 - Bàn giao & Kích hoạt bảo hành điện tử: Khách hàng kiểm tra lại toàn bộ chức năng, thanh toán và nhận phiếu bảo hành điện tử qua SMS/Zalo.",
                "POLICY_REPAIR",
                cancellationToken);

            // 3. Chính sách bán hàng & thanh toán VietQR
            await _storeAssistant.IngestDocumentAsync(
                "Chính sách bán hàng và thanh toán VietQR",
                @"Quy định bán hàng và thanh toán tại cửa hàng PSP:
1. Chấp nhận thanh toán bằng Tiền mặt và Chuyển khoản ngân hàng qua mã VietQR động tự động đối soát giao dịch trong 3 giây.
2. Chương trình Tích điểm Hội viên (PSP Loyalty): Mỗi 100.000 VNĐ thanh toán tương đương 1 điểm thưởng (1 điểm = 1.000 VNĐ chiết khấu lần sau).
3. Hạng hội viên gồm 4 cấp: Standard, Silver (từ 5 triệu), Gold (từ 20 triệu), Diamond (từ 50 triệu) với ưu đãi giảm giá sửa chữa từ 5% đến 15%.
4. Hóa đơn bán lẻ có giá trị pháp lý tra cứu bảo hành và đối chiếu khiếu nại trong vòng 30 ngày.",
                "POLICY_SALES",
                cancellationToken);

            // 4. Quy định an toàn linh kiện và bảo mật thông tin
            await _storeAssistant.IngestDocumentAsync(
                "Quy định an toàn linh kiện và bảo mật thông tin",
                @"Quy định bảo mật thông tin và an toàn linh kiện tại PSP:
1. Nghiêm cấm kỹ thuật viên truy cập, sao chép hoặc trích xuất hình ảnh, tin nhắn, dữ liệu cá nhân của khách hàng khi tiếp nhận máy.
2. Thiết bị của khách hàng bắt buộc được lưu giữ trong tủ khóa chuyên dụng có camera an ninh giám sát 24/7.
3. Toàn bộ linh kiện thay ra (linh kiện cũ hỏng) phải được hoàn trả lại cho khách hàng khi nhận máy.",
                "POLICY_SECURITY",
                cancellationToken);

            _logger.LogInformation("✅ Nạp 4 bộ tài liệu tri thức vào Qdrant Vector DB thành công!");
        }
        catch (Exception ex)
        {
            // 🛡️ CHỐT CHẶN TỬ HUYỆT 2 (FAIL-SAFE): Ghi cảnh báo nhẹ nhàng, không ném ngoại lệ làm sập API
            _logger.LogWarning(ex, "⚠️ Chưa thể kết nối hoặc nạp tri thức vào Qdrant Vector DB (Cổng gRPC 6334 / Ollama). Hệ thống vẫn hoạt động bình thường ở chế độ Chat trực tiếp.");
        }
    }
}
