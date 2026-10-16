import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useInventoryPageTour = () => {
  const isTourCompleted = useRef(false);
  const navigate = useNavigate();

  const startTour = useCallback(() => {
    isTourCompleted.current = false;
    // 1. Kích hoạt cờ Sandbox đào tạo an toàn
    sessionStorage.setItem('psp_sandbox_mode', 'true');

    // 2. Khởi tạo Driver.js với easing tối ưu và smoothScroll thủ công
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: false,
      duration: 320,
      allowClose: true,
      overlayColor: '#090d16',
      overlayOpacity: 0.82,
      stagePadding: 6,
      stageRadius: 14,
      popoverClass: 'psp-driver-theme',
      progressText: 'Bước {{current}} / {{total}}',
      nextBtnText: 'Tiếp tục →',
      doneBtnText: 'Hoàn tất & Thoát Sandbox 🛡️',
      onCloseClick: () => {
        driverObj.destroy();
      },
      onDoneClick: () => {
        exitSandboxMode({ navigate });
        driverObj.destroy();
      },
      onDestroyed: () => {
        exitSandboxMode({ navigate });
      },
      onHighlightStarted: (element) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        // Không cuộn giật màn hình nếu phần tử đã hiển thị rõ ràng trong tầm mắt
        const isComfortablyVisible = rect.top >= 70 && rect.bottom <= (window.innerHeight - 60);
        if (!isComfortablyVisible) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      },
      onHighlighted: (_element, _step, { driver }) => {
        driver.refresh();
        setTimeout(() => driver.refresh(), 120);
        setTimeout(() => driver.refresh(), 280);
      },
      steps: [
        {
          element: '#tour-inv-header',
          popover: {
            title: '📦 Sổ Bộ Tồn Kho & Quản Lý Vị Trí Kệ Tủ',
            description:
              'Chào mừng bạn đến với khu vực kiểm soát hàng hóa! Tại đây bạn theo dõi số lượng tồn thực tế của từng mã linh kiện, đối chiếu giữa số trên máy và số lượng nằm trong hộc tủ vật lý.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-inv-filter-lowstock',
          popover: {
            title: '🚨 Bộ Lọc Báo Động Hàng Cạn Sàn',
            description:
              'Bật bộ lọc này để khoanh vùng ngay những linh kiện chạm mức tối thiểu (Min-Stock). Giúp thủ kho kịp thời phát hiện và làm phiếu đặt hàng bổ sung trước khi thợ hết đồ thay.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-inv-audit-btn',
          popover: {
            title: '🔍 Kiểm Kho Nhanh Tại Chỗ (Quick Audit)',
            description:
              'Khi kiểm tra ngăn kéo mà thấy số lượng thực tế khác với số trên máy (ví dụ máy báo 3 pin nhưng hộc chỉ còn 2), bấm nút này để nhập số đếm thực tế và ghi chú lý do cân bằng ngay tức thì.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-inv-transfer-btn',
          popover: {
            title: '🔄 Luân Chuyển Hàng Chi Viện Chi Nhánh',
            description:
              'Khi chi nhánh khác thiếu linh kiện sửa máy gấp mà kho bạn còn dư, bấm nút này để tạo phiếu điều chuyển hàng liên kho bài bản, chuẩn quy trình.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#tour-inv-tracker-btn',
          popover: {
            title: '🚚 Theo Dõi Shipper & Nhận Hàng Liên Kho',
            description:
              'Giám sát hành trình các thùng hàng đang vận chuyển. Khi shipper mang linh kiện từ chi nhánh khác tới nơi, bạn bấm [Nhận hàng] để đồ tự động cộng vào tủ kho của mình.',
            side: 'bottom',
            align: 'end',
          },
        },
      ],
    });

    driverObj.drive();
  }, []);

  return { startTour };
};
