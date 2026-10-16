import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useStockTakeTour = () => {
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
          element: '#tour-stocktake-header',
          popover: {
            title: '📋 Kiểm Kê & Đối Soát Kho Hàng Định Kỳ',
            description:
              'Chào mừng bạn đến với khu vực kiểm kê tủ đồ! Đây là nghiệp vụ trọng yếu của Thủ kho nhằm đảm bảo số lượng linh kiện ghi trên máy tính khớp 100% với số lượng thực tế trong từng hộc tủ.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-stocktake-mode',
          popover: {
            title: '🏢 Chọn Kho Kiểm Kê & Chốt Số Liệu Sổ Sách',
            description:
              'Chọn kho cần kiểm (ví dụ Tổng kho HQ hoặc Tủ linh kiện nhanh tại bàn kỹ thuật viên). Hệ thống sẽ tự động chốt số tồn máy tính (System Qty) làm căn cứ đối chiếu.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-stocktake-sheet',
          popover: {
            title: '✍️ Bảng Kê Đếm Thực Tế Từng Hộc Tủ',
            description:
              'Đi dọc từng ngăn tủ: Đếm được bao nhiêu cái, gõ trực tiếp vào cột "Thực tế". Cột "Chênh lệch" sẽ tự động nhảy số: Màu ĐỎ nếu thiếu hàng (-), Màu XANH nếu thừa hàng (+). Nhấn Tab để nhảy nhanh sang dòng tiếp theo.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-stocktake-reconcile',
          popover: {
            title: '⚖️ Cân Bằng Kho & Đồng Bộ Sổ Sách',
            description:
              'Sau khi nhập xong và ghi chú giải trình lý do lệch (ví dụ: pin phồng hỏng, thợ mượn chưa ký), bấm nút này để hệ thống tự động ép số tồn kho trên máy về đúng số thực tế bạn vừa đếm.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-stocktake-history',
          popover: {
            title: '📑 Lịch Sử Biên Bản Kiểm Kê Cũ',
            description:
              'Chuyển sang tab Lịch sử để tra cứu các biên bản kiểm kho các đợt trước. Bạn có thể in biên bản này kèm chữ ký để giải trình với Quản lý hoặc Kế toán nội bộ.',
            side: 'bottom',
            align: 'end',
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
