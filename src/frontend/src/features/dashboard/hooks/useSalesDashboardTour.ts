import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useSalesDashboardTour = () => {
  const driverRef = useRef<Driver | null>(null);
  const isNavigatingToPos = useRef(false);
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
    isNavigatingToPos.current = false;

    // Maintain sandbox mode
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
      doneBtnText: 'Sang Trạm POS 🚀',
      onCloseClick: () => {
        driverObj.destroy();
        exitSandboxMode({ navigate });
      },
      onDestroyed: () => {
        setIsTourActive(false);
        driverRef.current = null;
        if (!isNavigatingToPos.current) {
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
          element: '#tour-sales-ribbon',
          popover: {
            title: '💼 Bàn Làm Việc Chuyên Viên Bán Hàng & Thu Ngân',
            description:
              'Chào mừng bạn đến với ca làm việc Sales! Dải thông tin này định danh chuyên viên bán hàng, chi nhánh đang trực và trạng thái ca quầy thu ngân đang kết nối trực tuyến.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-exception',
          popover: {
            title: '⚠️ Cảnh Báo: Đơn Chờ Thu Ngân Xử Lý',
            description:
              'Các đơn hàng ở trạng thái [Chờ Thanh Toán] (Pending) cần được thu tiền sớm hoặc hủy để giải phóng lượng tồn kho giữ chỗ ảo cho chi nhánh.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-pending-queue',
          popover: {
            title: '⏳ Hàng Đợi Đơn Chờ Thanh Toán',
            description:
              'Thao tác 1-click tiện lợi: bạn có thể bấm [Thu tiền] (nút xanh) để duyệt và xuất hóa đơn ngay, hoặc bấm [Hủy] nếu khách đổi ý không lấy hàng.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-recent-queue',
          popover: {
            title: '🧾 Đơn Hàng Gần Đây & In Hóa Đơn',
            description:
              'Theo dõi dòng tiền và danh sách các đơn vừa thanh toán thành công trong ngày. Bạn có thể mở xem chi tiết đơn để đối soát hoặc in lại phiếu thu K80.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-top-selling',
          popover: {
            title: '🚀 Sản Phẩm Bán Chạy Tại Quầy',
            description:
              'Gợi ý nhanh các mặt hàng phụ kiện, ốp lưng, sạc cáp có lượt mua cao hôm nay giúp bạn chủ động tư vấn up-sell kèm khi khách ghé quầy thanh toán.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-open-pos',
          popover: {
            title: '🛒 Mở Màn Hình Bán Hàng POS',
            description:
              'Bấm nút [Mở Màn Hình POS] để chuyển sang giao diện máy tính tiền POS chuyên dụng: quét mã vạch, chọn khách hàng, áp voucher và thanh toán tức thì!',
            side: 'bottom',
            align: 'end',
            onNextClick: () => {
              isNavigatingToPos.current = true;
              stopTour();
              toast.success('Chuyển sang Màn hình POS Bán Hàng...', { icon: '🚀' });
              navigate('/pos?mode=training&tour=pos');
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
