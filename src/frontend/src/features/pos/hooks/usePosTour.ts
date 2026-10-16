import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const usePosTour = () => {
  const driverRef = useRef<Driver | null>(null);
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
          element: '#tour-pos-scanner',
          popover: {
            title: '🔍 Quét Mã Vạch & Tìm Nhanh Sản Phẩm',
            description:
              'Khu vực nhập mã Barcode hoặc tìm kiếm theo tên mặt hàng/SKU. Bạn có thể cắm máy quét laser hoặc gõ từ khóa để đưa sản phẩm vào giỏ hàng ngay lập tức.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-pos-catalog',
          popover: {
            title: '📦 Danh Mục & Lưới Sản Phẩm Quầy',
            description:
              'Hiển thị danh sách các sản phẩm đang có sẵn tại kho chi nhánh kèm giá bán niêm yết và số lượng tồn kho thực tế. Bấm vào bất kỳ thẻ sản phẩm nào để thêm vào giỏ hàng.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-pos-cart',
          popover: {
            title: '🛒 Giỏ Hàng & Tùy Chỉnh Số Lượng',
            description:
              'Quản lý các mặt hàng khách đã chọn: điều chỉnh số lượng mua (+/-), nhập số IMEI đối với máy điện thoại quản lý serial, hoặc xóa món không lấy.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-pos-customer',
          popover: {
            title: '👤 Khách Hàng & Tích Điểm Thành Viên',
            description:
              'Tìm khách hàng quen qua số điện thoại để ghi nhận doanh số và tích điểm thành viên. Bạn cũng có thể bấm nút (+) để thêm nhanh khách mới trong 5 giây.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-pos-voucher',
          popover: {
            title: '🏷️ Mã Khuyến Mãi & Voucher',
            description:
              'Nhập mã khuyến mãi (ví dụ: [SALES10] giảm 10% hoặc [TRIAN50K] giảm 50.000đ) để áp dụng chiết khấu tự động cho đơn hàng.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '#tour-pos-checkout-btn',
          popover: {
            title: '💳 Nút Thanh Toán & Xuất Hóa Đơn K80',
            description:
              'Bấm [Thanh Toán] (hoặc phím tắt F2) để mở hộp thoại thu tiền: chọn Tiền mặt (tự động tính tiền thừa trả khách) hoặc Chuyển khoản VietQR, và in hóa đơn K80 hoàn tất giao dịch!',
            side: 'top',
            align: 'end',
            onNextClick: () => {
              stopTour();
              toast.success('Bạn đã nắm rõ quy trình bán lẻ POS! Hãy thử thao tác thanh toán mẫu nhé.', { icon: '🎉' });
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
