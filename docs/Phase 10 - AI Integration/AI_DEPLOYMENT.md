# AI DEPLOYMENT & MODEL CONFIGURATION

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 10 - AI Integration

---

## 1. Yêu cầu Phần cứng (Hardware Requirements)

Vì hệ thống sử dụng Local LLM (Ollama) và In-process Embedding (bge-m3), yêu cầu cấu hình máy chủ On-premise tối thiểu như sau:
* **CPU:** 8 Cores (hoặc 16 Threads).
* **RAM:** Tối thiểu 32 GB (16 GB cho hệ điều hành + Spring Boot + DB, 16 GB dành riêng cho Ollama model load vào RAM).
* **GPU (Khuyến nghị):** NVIDIA RTX 3060 12GB VRAM hoặc RTX 4070 để chạy mượt mà Qwen2.5 7B. (Nếu chạy 14B cần 24GB VRAM).
* **Ổ cứng:** SSD NVMe >= 512GB.

## 2. Cài đặt Môi trường (Docker Compose)

Khởi chạy cơ sở hạ tầng thông qua `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Cơ sở dữ liệu nghiệp vụ
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: phone_store
    ports:
      - "5432:5432"

  # Cơ sở dữ liệu Vector cho RAG
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333" # REST API
      - "6334:6334" # gRPC

  # Local LLM Server
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 3. Khởi tạo Mô hình AI (Model Initialization)

Sau khi container Ollama chạy, thực hiện lệnh nạp mô hình Qwen vào hệ thống:

```bash
# Vào shell của container ollama
docker exec -it ollama bash

# Tải model (Tuỳ thuộc VRAM, khuyên dùng qwen2.5 7b hoặc qwen-agent)
ollama pull qwen2.5:7b
```

## 4. Quản lý Hiệu năng (Performance Tuning)
* Tránh tình trạng quá tải (OOM - Out of Memory): Nếu dùng RAM thường (không có GPU), cần giới hạn số lượng request đồng thời gọi vào AI (sử dụng Rate Limiter trong Spring Boot) vì CPU Inference rất tốn tài nguyên.
* Cập nhật định kỳ Vector DB: RAG ingestion script nên được chạy thông qua Cronjob (ví dụ: mỗi đêm lúc 2h sáng) để cập nhật dữ liệu mới thay vì cập nhật thủ công.
