import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useManagerDashboardTour = () => {
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

    // Maintain sandbox mode in sessionStorage and URL
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
          element: '#tour-manager-header',
          popover: {
            title: '👑 Bàn Chỉ Huy Điều Hành Cửa Hàng Trưởng',
            description:
              'Chào mừng bạn đến với ca trực của Cửa Hàng Trưởng! Đây là trung tâm giám sát toàn diện doanh thu, dòng tiền, năng suất kỹ thuật và chuỗi cung ứng được khóa chặt theo phạm vi chi nhánh trực thuộc của bạn.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-manager-approval-queue',
          popover: {
            title: '🛡️ Hàng Chờ Phê Duyệt & Kiểm Soát Rủi Ro (Approval Queue)',
            description:
              'Trọng tâm quyền lực của Manager! Mọi ngoại lệ nguy hiểm từ nhân viên (Hủy hóa đơn bán lẻ, Lệch kho kiểm kê, Xuất linh kiện đắt tiền) đều tập trung tại đây. Bạn có thẩm quyền tối cao xem xét và quyết định Duyệt hoặc Từ chối.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-manager-filter-tabs',
          popover: {
            title: '📂 Phân Loại 3 Nhóm Ngoại Lệ Nghiệp Vụ',
            description:
              'Lọc nhanh theo 3 chuyên mục chính: [Hủy đơn] (Void bill POS chống gian lận thu ngân), [Lệch kho] (Thủ kho kiểm kê thừa/thiếu linh kiện), và [Linh kiện] (KTV xin xuất phụ tùng đắt tiền >5tr).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-manager-deep-link',
          popover: {
            title: '🔍 Nút "Chi Tiết" - Thẩm Định Thực Địa Thay Vì Duyệt Mù',
            description:
              'Nguyên tắc cốt lõi: Tuyệt đối không bấm duyệt bừa trên Dashboard! Bấm "Chi tiết" sẽ đưa bạn sang trang nghiệp vụ thực địa (/sales, /stock-take, /repairs) để đối chiếu chứng từ, số IMEI, camera trước khi ra quyết định.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-manager-quick-approve',
          popover: {
            title: '⚡ Thao Tác Phê Duyệt & Ghi Nhận Lý Do Từ Chối',
            description:
              'Khi bấm [Duyệt], hệ thống sẽ tự động đồng bộ sang kho hoặc tài chính. Nếu bấm [Từ chối], bạn phải nhập biên bản giải trình để nhân viên cấp dưới nắm rõ sai sót và chỉnh sửa chứng từ.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-manager-revenue-trend',
          popover: {
            title: '📊 Phân Tích Doanh Thu & Biên Lợi Nhuận Gộp (Gross Margin)',
            description:
              'Theo dõi biến động doanh thu theo chu kỳ (Hôm nay, Tuần này, Tháng này, 30 ngày), tỷ suất lợi nhuận gộp và số lượng thiết bị bán ra để nhận diện ngày đạt đỉnh và ngày chạm đáy để phân bổ ca trực.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-manager-repairs-kpi',
          popover: {
            title: '🔧 Giám Sát Ca Sửa Chữa & Cảnh Báo Trễ Hẹn SLA',
            description:
              'Nắm bắt số lượng máy đang tiếp nhận, đang sửa, chờ duyệt giá và đặc biệt là các ca trễ hẹn cam kết với khách hàng (SLA breach) để trực tiếp can thiệp điều phối thợ bậc cao.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-manager-supplier-debt',
          popover: {
            title: '💰 Quản Trị Dòng Tiền & Công Nợ Nhà Cung Cấp',
            description:
              'Theo dõi các khoản nợ nhập hàng đến hạn thanh toán, lên kế hoạch chi trả công nợ định kỳ để đảm bảo uy tín và nguồn cung linh kiện liên tục cho chi nhánh.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-manager-sandbox-action',
          popover: {
            title: '🎯 Hoàn Tất Hướng Dẫn Vận Hành Cửa Hàng Trưởng',
            description:
              'Bạn đã nắm trọn vẹn toàn bộ 6 trụ cột điều hành của Cửa hàng trưởng! Bấm [Hoàn tất & Thoát Sandbox] bên dưới để đóng hướng dẫn và trở về chế độ làm việc với dữ liệu thật. Bạn có thể bật lại chế độ thực hành bất cứ lúc nào.',
            side: 'bottom',
            align: 'center',
          },
        },
      ],
    });

    driverRef.current = driverObj;
    setIsTourActive(true);

    try {
      driverObj.drive();
      toast(
        '👑 Khởi động Hướng Dẫn Nghiệp Vụ Cửa Hàng Trưởng!',
        { icon: '⭐', duration: 3000 }
      );
    } catch (e) {
      console.error('Error starting manager dashboard tour:', e);
      setIsTourActive(false);
    }
  }, [navigate]);

  return {
    startTour,
    stopTour,
    isTourActive,
  };
};
