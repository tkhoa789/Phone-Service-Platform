import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useTechnicianDashboardTour = () => {
  const driverRef = useRef<Driver | null>(null);
  const isNavigatingToRepairs = useRef(false);
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
    isNavigatingToRepairs.current = false;

    // Luôn duy trì sandbox mode
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
      prevBtnText: '← Quay lại',
      doneBtnText: 'Sang Bàn Sửa Chữa 🚀',
      onCloseClick: () => {
        driverObj.destroy();
        exitSandboxMode({ navigate });
      },
      onDestroyed: () => {
        setIsTourActive(false);
        driverRef.current = null;
        if (!isNavigatingToRepairs.current) {
          exitSandboxMode({ navigate, silent: true });
        }
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
          element: '#tour-tech-ribbon',
          popover: {
            title: '👨‍🔧 Không Gian Kỹ Thuật Viên Sửa Chữa',
            description:
              'Chào mừng bạn đến với Bàn làm việc Kỹ thuật! Ribbon này xác định rõ danh tính KTV đang đăng nhập, chi nhánh xưởng sửa chữa và tình trạng hoạt động của trạm dịch vụ kỹ thuật.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-tech-queues',
          popover: {
            title: '📋 3 Hàng Đợi Ca Việc Trọng Yếu',
            description:
              'Quản trị dòng chảy ca việc rõ ràng: [Ca Của Tôi] (máy bạn đang trực tiếp sửa), [Hàng Đợi Tiếp Nhận Chi Nhánh] (máy mới khách gửi đang chờ thợ bốc nhận), và [Đã Xong Chờ Giao] (máy đã qua QC nằm chờ khách lấy).',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-tech-active-table',
          popover: {
            title: '⚙️ Bảng Ca Sửa Đang Xử Lý Của Tôi',
            description:
              'Nơi quản lý chi tiết từng thiết bị đang nằm trên bàn làm việc của bạn: model máy, hiện tượng hư hỏng, trạng thái kỹ thuật và nút [Xử lý] để mở nhanh ca máy.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-tech-exceptions',
          popover: {
            title: '⚠️ Cảnh Báo Điểm Nghẽn Ca Sửa',
            description:
              'Báo động ngay lập tức các ca bị nghẽn: [Kẹt Chờ Linh Kiện] (hết phụ tùng thay thế) hoặc [Chờ Khách Duyệt Giá] (phát sinh chi phí), giúp KTV chủ động phối hợp giải quyết nhanh chóng.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-tech-go-repairs',
          popover: {
            title: '✨ Chuyển Sang Bàn Sửa Chữa Chi Tiết',
            description:
              'Bấm nút [Bàn Sửa Chữa Tiếp Nhận] để chuyển sang trang Quản lý sửa chữa chi tiết (/repairs). Hệ thống sẽ tự động dẫn dắt bạn thực hành thao tác nhận việc và chuyển bước kỹ thuật thực chiến!',
            side: 'bottom',
            align: 'end',
            onNextClick: () => {
              isNavigatingToRepairs.current = true;
              stopTour();
              toast.success('Chuyển sang Bàn Sửa Chữa Thực Hành...', { icon: '🚀' });
              navigate('/repairs?mode=training&tour=auto');
            },
          },
        },
      ],
    });

    driverRef.current = driverObj;
    setIsTourActive(true);
    driverObj.drive();
  }, [stopTour, navigate]);

  return {
    startTour,
    stopTour,
    isTourActive,
  };
};
