import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useWarehousesInventoryTour = () => {
  const isTourCompleted = useRef(false);
  const navigate = useNavigate();

  const startTour = useCallback(() => {
    isTourCompleted.current = false;
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
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
      steps: [
        {
          element: '#tour-wh-map',
          popover: {
            title: '🏢 Sơ Đồ Phân Bổ Các Ngăn Tủ Vật Lý',
            description:
              'Chào mừng bạn đến với Danh mục Kho bãi dưới lăng kính Thủ kho! Tại một cửa hàng có nhiều điểm lưu trữ: Tổng kho nhận hàng xe tải, Tủ đồ nhanh tại bàn kỹ thuật viên, và Hộc cách ly chứa hàng lỗi bảo hành (RMA).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-wh-default',
          popover: {
            title: '⭐ Thiết Lập Kho Làm Việc Mặc Định',
            description:
              'Cài đặt kho làm việc chính cho chi nhánh của bạn. Khi tạo đơn mua hàng hoặc thợ xin đồ sửa, hệ thống sẽ tự động trừ hàng vào đúng tủ này mà không bị trừ nhầm sang chi nhánh khác.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-wh-keeper',
          popover: {
            title: '👤 Phân Công Thủ Kho Chịu Trách Nhiệm',
            description:
              'Mỗi ngăn tủ kho đều có thủ kho được phân công chịu trách nhiệm trực tiếp về số lượng và tài sản. Giúp bàn giao ca trực rành mạch, minh bạch.',
            side: 'left',
            align: 'center',
            onNextClick: () => {
              isTourCompleted.current = true;
              driverObj.destroy();
            },
          },
        },
      ],
    });

    driverObj.drive();
  }, []);

  return { startTour };
};
