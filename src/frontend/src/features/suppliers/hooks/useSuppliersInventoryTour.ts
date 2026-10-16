import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useSuppliersInventoryTour = () => {
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
          element: '#tour-sup-search',
          popover: {
            title: '📇 Danh Bạ Đối Tác Cung Ứng Linh Kiện',
            description:
              'Chào mừng bạn đến với Danh bạ Nhà cung cấp dưới lăng kính Thủ kho! Đây là sổ tay liên hệ các tổng kho sỉ linh kiện, phụ kiện, máy ép kính uy tín.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-sup-contact',
          popover: {
            title: '📞 Hotline & Zalo Giục Giao Hàng Hỏa Tốc',
            description:
              'Khi tủ đồ cạn pin/màn hình mà khách đang ngồi chờ tại tiệm, tra cứu nhanh số điện thoại hoặc Zalo của đầu mối giao sỉ tại đây để giục xe ôm công nghệ giao gấp linh kiện.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-sup-debt-notice',
          popover: {
            title: '🔒 Giới Hạn Nghiệp Vụ: Khóa Quyền Trả Nợ',
            description:
              'Lưu ý phân quyền: Thủ kho chỉ quản lý việc nhận đủ hàng và đổi trả hàng lỗi. Nghiệp vụ thanh toán công nợ, đối soát tiền bạc thuộc thẩm quyền của Kế toán và Chủ tiệm (tính năng thanh toán bị ẩn với bạn).',
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
