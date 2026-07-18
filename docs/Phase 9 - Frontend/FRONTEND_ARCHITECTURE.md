# FRONTEND ARCHITECTURE & DESIGN

## Hệ thống quản lý chuỗi cửa hàng điện thoại tích hợp AI Assistant

**Version:** 1.0
**Phase:** 9 - Frontend

---

## 1. Công nghệ Sử dụng
* **Framework:** React 18+ (hoặc Next.js 14).
* **Ngôn ngữ:** TypeScript.
* **State Management:** Zustand hoặc Redux Toolkit.
* **Data Fetching:** React Query (TanStack Query) hoặc SWR.
* **UI Library:** Ant Design (AntD) hoặc TailwindCSS + Shadcn UI.

## 2. Cấu trúc Thư mục (Directory Structure)

```text
src/
 ├── assets/          # Hình ảnh, icon, font
 ├── components/      # UI components dùng chung (Button, Table, Modal)
 ├── features/        # Các module nghiệp vụ (auth, sales, inventory, ai-chat)
 │    ├── auth/
 │    │    ├── components/
 │    │    ├── hooks/
 │    │    └── api/
 ├── layouts/         # MainLayout, AuthLayout
 ├── pages/           # Cấu hình Routing
 ├── store/           # Global state (Zustand)
 ├── utils/           # Helper functions (format tiền, ngày tháng)
 └── App.tsx
```

## 3. Tích hợp AI Assistant (Frontend)
* **Floating Widget:** Giao diện AI Chat nằm ở một `Drawer` hoặc `Floating Popover` ở góc phải dưới màn hình, có thể bật tắt mọi lúc.
* **Generative UI Component:** Khi Backend (AI) trả về 1 thẻ chứa thông tin đặc biệt (ví dụ: JSON mô tả 1 đơn hàng cần xác nhận), Frontend sử dụng cơ chế Dynamic Rendering để hiển thị thẻ HTML thay vì text thường.
* **Sự kiện chuyển trang (Event-driven Navigation):** Frontend lắng nghe các command từ tin nhắn AI (ví dụ: `{"action": "navigate", "url": "/orders/123"}`) để tự động đổi route bằng `react-router-dom`.
