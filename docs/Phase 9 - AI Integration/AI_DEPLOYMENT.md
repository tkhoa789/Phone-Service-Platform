# AI DEPLOYMENT & MODEL CONFIGURATION

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.1 (Chuẩn hóa theo .NET 10, SQL Server 2022, Qdrant 1.12.0 & Ollama)
**Phase:** 9 - AI Integration

---

## 1. Yêu cầu Phần cứng & Chiến lược Mô hình Kép (Dual-Model Strategy)

Hệ thống AI Assistant vận hành hoàn toàn On-Premise (Local AI) bảo mật tuyệt đối dữ liệu nội bộ và triệt tiêu 100% chi phí bản quyền API Cloud theo token.

### 1.1 Chiến lược Mô hình Kép (Dual-Model Architecture)
* **Production Target (Mô hình Mục tiêu Sản xuất):** `krith/qwen2.5-14b-instruct:IQ3_XXS`
  * Số lượng tham số: 14.7 Tỷ tham số.
  * Kỹ thuật lượng tử hóa: IQ3_XXS (Importance Matrix 3-bit).
  * Dung lượng VRAM chiếm dụng: ~6.2 GB (Load hoàn toàn 100% 48/48 layers lên GPU NVIDIA RTX 3070 Ti 8GB VRAM).
  * Tốc độ sinh văn bản: 33.4 tokens/giây (Time-to-First-Token TTFT: 420ms).
  * Khả năng: Hiểu sâu sắc sắc thái tiếng Việt, lý luận nghiệp vụ phức tạp và gọi Tool Calling cực kỳ chuẩn xác.
* **Baseline Fallback (Mô hình Dự phòng Nhẹ):** `qwen2.5:7b-instruct:q4_K_M`
  * Dung lượng VRAM: ~4.7 GB (thích hợp cho các máy trạm không có card rời mạnh hoặc GPU 6GB).
* **Embedding Model:** `nomic-embed-text` (768 chiều nhúng, ngữ cảnh 8192 tokens, dung lượng ~550MB).

### 1.2 Yêu cầu Phần cứng Máy chủ Khuyến nghị
* **CPU:** 8 Cores / 16 Threads (Intel Core i7-12700 / AMD Ryzen 7 5800X trở lên).
* **RAM:** Tối thiểu 32 GB DDR4/DDR5 (16 GB cho HĐH + .NET Backend + SQL Server, 16 GB dự phòng suy luận AI).
* **GPU:** NVIDIA RTX 3070 Ti 8GB VRAM (hoặc RTX 3060 12GB, RTX 4070 12GB).
* **Ổ cứng:** SSD NVMe M.2 tối thiểu 512GB (tốc độ đọc >= 3000 MB/s).

---

## 2. Cài đặt Hạ tầng (Docker Compose)

Khởi chạy toàn bộ hạ tầng dịch vụ phụ trợ thông qua `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # CSDL Quan hệ Cấp Doanh nghiệp
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: psp-sqlserver
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=Password123!
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql

  # Bộ đệm Phân tán & Khóa Idempotency Fast-Path
  redis:
    image: redis:7-alpine
    container_name: psp-redis
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Cơ sở Dữ liệu Vector cho RAG
  qdrant:
    image: qdrant/qdrant:v1.12.0
    container_name: psp-qdrant
    ports:
      - "6333:6333" # REST API
      - "6334:6334" # gRPC
    volumes:
      - qdrant_data:/qdrant/storage

  # Máy chủ Suy luận Trí tuệ Nhân tạo Local LLM
  ollama:
    image: ollama/ollama:latest
    container_name: psp-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  mssql_data:
  redis_data:
  qdrant_data:
  ollama_data:
```

---

## 3. Khởi tạo và Nạp Mô hình AI

```bash
# Nạp mô hình nhúng Text
docker exec -it psp-ollama ollama pull nomic-embed-text

# Nạp mô hình Production Target 14B lượng tử hóa
docker exec -it psp-ollama ollama pull krith/qwen2.5-14b-instruct:IQ3_XXS

# Nạp mô hình Baseline 7B dự phòng
docker exec -it psp-ollama ollama pull qwen2.5:7b-instruct:q4_K_M
```

---

## 4. Quản lý Hiệu năng & Giám sát Vận hành
* **GPU Memory Footprint:** Giới hạn context window ở mức `OLLAMA_NUM_CTX=4096` trong `appsettings.json` để giữ VRAM luôn dưới ngưỡng an toàn (6.5 GB / 8 GB).
* **Two-Tier Fallback Resilience:** Khi GPU hoặc Ollama gặp sự cố gián đoạn, `StoreAssistant.cs` tự động phát hiện Circuit Breaker và chuyển hướng phản hồi thông báo hỗ trợ người dùng mà không làm crash Backend ASP.NET Core.
* **Vector Sync Worker:** Background worker định kỳ quét và đồng bộ tri thức mới từ SQL Server lên Qdrant collection `store-knowledge`.
