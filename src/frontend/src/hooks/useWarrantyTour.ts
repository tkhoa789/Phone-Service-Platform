import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import { exitSandboxMode } from '../utils/sandboxUtils';
import '../styles/driver-theme.css';

export const useWarrantyTour = () => {
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
          element: '#tour-sandbox-banner',
          popover: {
            title: '🎓 Chế độ Thực hành Sandbox',
            description: 'Chào mừng bạn đến với môi trường huấn luyện nghiệp vụ bảo hành! Mọi thao tác đều diễn ra an toàn trên bộ nhớ đệm (In-memory), không chạm tới Database thật. Bạn có thể tự do thao tác mà không sợ mất dữ liệu.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-status-tabs',
          popover: {
            title: '📑 Quản lý Luồng Trạng thái',
            description: 'Theo dõi tiến độ bảo hành qua 4 giai đoạn chuẩn: Tiếp nhận (Received) ➔ Đang xử lý (Processing) ➔ Hoàn tất bàn giao (Completed) hoặc Từ chối bảo hành (Rejected).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-lookup-widget',
          popover: {
            title: '🔍 Tra cứu Bảo hành Điện tử (Care+ Portal)',
            description: 'Tra cứu nhanh IMEI theo tiêu chuẩn AppleCare+ / Samsung Care+. Tự động tính hạn bảo hành còn lại và cho phép tạo phiếu tiếp nhận bảo hành chỉ trong 1 click.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-process-btn',
          popover: {
            title: '⚙️ Thẩm định & 4 Nhánh Xử lý Nghiệp vụ',
            description: 'Click nút này để thực hành: (1) Sửa nội bộ với chi phí 0đ, (2) Từ chối bảo hành kèm chuyển sửa chữa dịch vụ, (3) Đổi mới thiết bị 1-1 BR-905 trong 30 ngày, hoặc (4) Gửi sang TTBH hãng Apple/Samsung AASP.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-deliver-btn',
          popover: {
            title: '🤝 Nghiệm thu & Bàn giao Trả khách',
            description: 'Sau khi thiết bị được sửa xong hoặc hoàn tất thủ tục, bấm vào đây để lập biên bản bàn giao, xác nhận khách đã nhận máy và kết thúc vòng đời bảo hành.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-timeline-btn',
          popover: {
            title: '⏱️ Nhật ký Minh bạch (Audit Timeline)',
            description: 'Bấm icon đồng hồ trên bất kỳ phiếu nào để theo dõi dòng thời gian lịch sử chi tiết: Ai đã xử lý, thời gian nào, hành động gì và liên kết phiếu sửa chữa liên quan.',
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
