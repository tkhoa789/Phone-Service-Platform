import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const usePurchaseOrdersTour = () => {
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
          element: '#tour-po-header',
          popover: {
            title: '🚚 Sổ Theo Dõi Đơn Mua Hàng Từ NCC',
            description:
              'Chào mừng bạn đến với khu vực tiếp nhận hàng nhập! Đây là nơi thủ kho theo dõi các đơn hàng đặt mua từ nhà phân phối phụ kiện/linh kiện lớn, biết trước hôm nay xe hàng nào sẽ cập bến.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-po-create-btn',
          popover: {
            title: '➕ Lập Đơn Đặt Hàng Mới (PO)',
            description:
              'Khi phát hiện tủ đồ cạn linh kiện, bấm vào đây để lên danh sách các món cần mua gửi nhà cung cấp đóng hàng chuyển về cửa hàng.',
            side: 'bottom',
            align: 'end',
          },
        },
        {
          element: '#tour-po-status-badge',
          popover: {
            title: '🏷️ Đọc Hiểu Trạng Thái Đơn Hàng',
            description:
              '• Draft: Đang soạn đồ cần mua.\n• Confirmed: Nhà cung cấp đã nhận đơn và xe hàng đang trên đường giao tới.\n• Received: Bạn đã nhận đủ đồ và nạp an toàn vào tủ kệ.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-po-receive-action',
          popover: {
            title: '📦 Quy Trình Tiếp Nhận Hàng Tại Dock',
            description:
              'Khi shipper giao thùng hàng tới cửa tiệm: Rạch thùng kiểm tra tình trạng hàng hóa ➔ Đếm đủ số lượng ➔ Dùng súng quét barcode/IMEI nạp vào máy ➔ Bấm hoàn tất để số lượng tự động tăng trong tủ.',
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
