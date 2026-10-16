import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useInventoryTour = () => {
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

    // Always maintain sandbox training mode during and after the tour
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
      smoothScroll: false, // We coordinate smooth scrolling cleanly to prevent coordinate drift
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

        // Smooth viewport positioning tailored specifically for each of the 5 steps
        if (element.id === 'tour-inv-header' || element.id === 'tour-inv-create-po') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (element.id === 'tour-inv-low-stock' || element.id === 'tour-inv-pending-po') {
          window.scrollTo({ top: 110, behavior: 'smooth' });
        } else if (element.id === 'tour-inv-quick-actions') {
          window.scrollTo({ top: 380, behavior: 'smooth' });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      },
      onHighlighted: (_element, _step, { driver }) => {
        // Recalculate once transition finishes and after smooth scroll completes
        driver.refresh();
        setTimeout(() => driver.refresh(), 120);
        setTimeout(() => driver.refresh(), 280);
      },

      steps: [
        {
          element: '#tour-inv-header',
          popover: {
            title: '🎓 Chế độ Thực hành Thủ Kho (Sandbox Mode)',
            description:
              'Chào mừng bạn đến với môi trường tập sự quản lý kho! Toàn bộ số liệu tại đây là dữ liệu mẫu độc lập (Shadow Store). Bạn có thể tự do bấm tạo đơn, nhập/xuất linh kiện hay kiểm kho mà không sợ ảnh hưởng đến số liệu kinh doanh thật của cửa hàng.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-inv-low-stock',
          popover: {
            title: '📦 Giám sát linh kiện sắp hết trong tủ',
            description:
              'Bảng này tự động gom các linh kiện có số lượng tồn rơi xuống dưới mức định mức (chữ số hiển thị màu đỏ). Giúp bạn chủ động biết ngay linh kiện nào sắp cạn để gọi hàng về, tránh tình trạng thợ nhận sửa máy mà trong tủ không có đồ thay. Bấm nút [Đặt PO] để lên đơn nhập hàng nhanh.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-inv-pending-po',
          popover: {
            title: '🚛 Tiếp nhận hàng giao tại cửa kho',
            description:
              'Nơi theo dõi các đơn hàng nhà cung cấp đang vận chuyển tới tiệm. Khi shipper hoặc xe tải mang thùng linh kiện đến, bạn bấm [Nhập kho] để xé thùng đối chiếu số lượng và cập nhật vào tủ. Chuông Sandbox sẽ reo và số lượng tồn sẽ tự động tăng lên ngay lập tức.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-inv-quick-actions',
          popover: {
            title: '🛠️ Các công cụ nghiệp vụ thủ kho thường dùng',
            description:
              '4 lối tắt giúp bạn truy cập nhanh chỉ với 1 cú click: (1) Tồn kho & Quản lý vị trí kệ/IMEI, (2) Đợt kiểm kê đếm lại tủ định kỳ, (3) Quản lý toàn bộ đơn mua PO, và (4) Danh bạ liên hệ nhà phân phối linh kiện.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-inv-create-po',
          popover: {
            title: '✨ Lập đơn đặt hàng mới & Bắt đầu trải nghiệm',
            description:
              'Khi phát hiện linh kiện vơi đi hoặc chuẩn bị cho các đợt sửa chữa lớn, bấm nút này để lên danh sách đặt hàng nhà cung cấp. Bạn đã nắm trọn vẹn quy trình của một Thủ kho chuyên nghiệp! Hãy bấm "Bắt đầu thực hành" để tự tay thao tác nhé.',
            side: 'bottom',
            align: 'end',
            onNextClick: () => {
              isTourCompleted.current = true;
              stopTour();
            },
          },
        },
      ],
    });

    driverRef.current = driverObj;
    setIsTourActive(true);
    driverObj.drive();
  }, [stopTour, navigate]);

  return { startTour, stopTour, isTourActive };
};
