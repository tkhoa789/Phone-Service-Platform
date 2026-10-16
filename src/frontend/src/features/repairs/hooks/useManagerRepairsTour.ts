import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useManagerRepairsTour = () => {
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
          element: '#tour-repair-header',
          popover: {
            title: '🔧 Giám Sát Trung Tâm Sửa Chữa (Manager Command)',
            description:
              'Chào mừng Cửa hàng trưởng! Đây là trung tâm điều phối toàn bộ chu trình dịch vụ sửa chữa: từ tiếp nhận, chẩn đoán, phân công thợ, kiểm soát linh kiện thay thế đến nghiệm thu QC và bàn giao khách.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-repair-kpis',
          popover: {
            title: '📊 4 Thước Đo Vận Hành Xưởng & Cảnh Báo SLA',
            description:
              'Theo dõi 4 chỉ số tức thời: [Chờ Nhận Việc] (máy mới cần thợ), [Đơn Của Tôi], [Đang Sửa Chữa] và [Đã Xong Chờ Giao]. Cảnh báo các ca có nguy cơ trễ hẹn cam kết (SLA breach) để trực tiếp can thiệp đôn đốc.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-repair-tabs',
          popover: {
            title: '🏷️ Lọc Hàng Đợi Ca Việc & Phân Luồng Kỹ Thuật',
            description:
              'Chuyển đổi nhanh giữa các nhóm trạng thái. Chọn tab [Chờ Phân Công] để lọc nhanh các ca máy mới tiếp nhận tại quầy lễ tân đang chờ Quản lý chỉ định thợ xử lý.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-repair-manager-assign',
          popover: {
            title: '🛠️ Phân Công Kỹ Thuật Viên Theo Bậc Nghề',
            description:
              'Nguyên tắc vàng của Quản lý: Đọc kỹ mô tả lỗi & ngoại quan trước khi bấm [+ Giao việc]. Ca thay linh kiện cơ bản (pin, loa, cáp) giao thợ bậc 1-2; Ca đục main, sửa nguồn, đóng IC, lỗi hiển thị gập Z Fold giao thợ cứng bậc 3-4 hoặc Trưởng nhóm Kỹ thuật!',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-repair-actions',
          popover: {
            title: '💎 Thẩm Định Chẩn Đoán & Duyệt Linh Kiện Đặc Biệt',
            description:
              'Với các ca phát sinh chi phí lớn (>5.000.000đ) hoặc cần xuất linh kiện đặc biệt (Màn hình bóc máy, Mainboard iPad M2), Manager đối chiếu chi phí, kiểm tra cọc của khách trước khi phê duyệt lệnh xuất kho.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-repair-guide-btn',
          popover: {
            title: '🎯 Hoàn Tất Hướng Dẫn Điều Hành Xưởng Sửa Chữa',
            description:
              'Bạn đã nắm rõ nguyên tắc điều phối kỹ thuật viên bậc 1-4, thẩm định chẩn đoán và duyệt xuất linh kiện đặc biệt! Bấm [Hoàn tất & Thoát Sandbox] để đóng hướng dẫn và trở về dữ liệu thật.',
            side: 'bottom',
            align: 'end',
          },
        },
      ],
    });

    driverRef.current = driverObj;
    setIsTourActive(true);

    try {
      driverObj.drive();
      toast(
        '👑 Bắt đầu Hướng Dẫn Điều Hành Xưởng Sửa Chữa Cho Quản Lý!',
        { icon: '🔧', duration: 3000 }
      );
    } catch (e) {
      console.error('Error starting manager repairs tour:', e);
      setIsTourActive(false);
    }
  }, [navigate]);

  return {
    startTour,
    stopTour,
    isTourActive,
  };
};
