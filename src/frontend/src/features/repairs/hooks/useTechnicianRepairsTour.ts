import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useTechnicianRepairsTour = () => {
  const driverRef = useRef<Driver | null>(null);
  const isTourCompleted = useRef(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const navigate = useNavigate();

  const stopTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    setIsTourActive(false);
  }, []);

  const startTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }
    isTourCompleted.current = false;

    try {
      sessionStorage.setItem('psp_sandbox_mode', 'true');
      const url = new URL(window.location.href);
      if (url.searchParams.get('mode') !== 'training') {
        url.searchParams.set('mode', 'training');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      duration: 320,
      smoothScroll: false,
      allowClose: true,
      overlayColor: '#090d16',
      overlayOpacity: 0.82,
      stagePadding: 8,
      stageRadius: 16,
      popoverOffset: 12,
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
        setIsTourActive(false);
        driverRef.current = null;
        exitSandboxMode({ navigate });
      },
      onHighlightStarted: (element) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const isInViewport =
          rect.top >= 80 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 40;

        if (!isInViewport) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      },
      steps: [
        {
          element: '#tour-repair-kpis',
          popover: {
            title: '📊 4 Chỉ Số Vận Hành Xưởng',
            description:
              'Theo dõi tức thời tình trạng máy móc: [Chờ Nhận Việc] (máy mới cần thợ nhận), [Đơn Của Tôi] (máy bạn phụ trách), [Đang Sửa Chữa] (máy đang tháo lắp), và [Đã Xong Chờ Giao] (máy đã qua QC).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-repair-tabs',
          popover: {
            title: '🏷️ Phân Loại Hàng Đợi Ca Việc',
            description:
              'Click chuyển đổi linh hoạt: chọn tab [Chờ Nhận Việc] để nhận máy mới, hoặc tab [Đơn Của Tôi] để tập trung thao tác các ca đang làm trên bàn kỹ thuật.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-repair-claim-btn',
          popover: {
            title: '🎯 Thao Tác: Nhận Việc Ngay',
            description:
              'Click nút [Nhận việc ngay] màu xanh ngọc trên dòng phiếu mẫu REP-DEMO-01. Phiếu sẽ tự động gán cho bạn, chuyển trạng thái sang [Đang Chẩn Đoán] và nhảy ngay vào tab [Đơn Của Tôi]!',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-repair-status-dropdown',
          popover: {
            title: '🔄 Cỗ Máy Trạng Thái Kỹ Thuật (State Machine)',
            description:
              'Quy trình chuẩn: [Chẩn đoán] ➔ [Chờ linh kiện] ➔ [Đang sửa chữa] ➔ [Chờ kiểm định QC] ➔ [Hoàn thành]. Sau khi hoàn thành khâu nào, bạn chọn bước tiếp theo tại menu này.',
            side: 'top',
            align: 'end',
          },
        },
        {
          element: '#tour-repair-actions',
          popover: {
            title: '📑 Biên Bản, Linh Kiện & Bàn Giao K80',
            description:
              'Click vào từng dòng máy để mở chi tiết: đối chiếu Checklist ngoại quan 12 điểm ban đầu, nạp linh kiện thay thế từ kho và in phiếu bàn giao K80 bảo hành cho khách hàng!',
            side: 'left',
            align: 'center',
            onNextClick: () => {
              isTourCompleted.current = true;
              stopTour();
              toast.success('Bạn đã sẵn sàng! Hãy bắt đầu thao tác trên các ca máy mẫu.', {
                icon: '⚡',
                duration: 4000,
              });
            },
          },
        },
      ],
    });

    driverRef.current = driverObj;
    setIsTourActive(true);
    driverObj.drive();
  }, [stopTour]);

  return {
    startTour,
    stopTour,
    isTourActive,
  };
};
