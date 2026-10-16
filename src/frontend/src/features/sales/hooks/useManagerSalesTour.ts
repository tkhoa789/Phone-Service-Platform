import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useManagerSalesTour = () => {
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
          element: '#tour-sales-order-header',
          popover: {
            title: '🛒 Giám Sát Đơn Hàng & Doanh Thu Quầy POS',
            description:
              'Chào mừng Cửa hàng trưởng! Đây là sổ cái lưu trữ mọi hóa đơn bán lẻ phát sinh tại chi nhánh. Manager chịu trách nhiệm kiểm soát tính toàn vẹn của doanh số, phòng chống gian lận chiết khấu và duyệt hủy đơn.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-order-search',
          popover: {
            title: '🔍 Tra Cứu Hóa Đơn Tức Thời Theo Mã & Khách Hàng',
            description:
              'Dễ dàng đối soát khi có khiếu nại bằng cách tìm theo Mã đơn (#SO-XXXX), Tên khách hoặc Số điện thoại. Khi nhân viên xin hủy đơn trên Dashboard, hãy tìm mã đơn tại đây để đối chiếu chứng từ trước khi quyết định.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-order-table',
          popover: {
            title: '📋 Bảng Danh Sách Đơn Hàng & Đối Soát Tiền Mặt',
            description:
              'Theo dõi chi tiết giá trị hóa đơn, thời gian bán và nhân viên phụ trách. Đối soát chéo giữa tổng tiền trên hệ thống và số dư bill máy POS quẹt thẻ ngân hàng.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-sales-order-invoice-btn',
          popover: {
            title: '🧾 Thẩm Định Hóa Đơn & Serial IMEI Sản Phẩm',
            description:
              'Bấm "Xem / In lại HĐ" để mở hóa đơn điện tử K80: Kiểm tra kỹ danh mục sản phẩm, đơn giá, chiết khấu và danh sách mã IMEI máy bán ra có khớp với sản phẩm vật lý thu hồi hay không.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-manager-void-order-btn',
          popover: {
            title: '🚫 Thẩm Quyền Hủy Hóa Đơn (Void Bill) & Hoàn Tồn Kho',
            description:
              'Nghiệp vụ rủi ro cao độc quyền của Manager! Khi khách đổi ý hoặc quẹt nhầm thẻ, Manager kiểm tra hàng đã trả lại quầy, sau đó bấm [Hủy Đơn]. Hệ thống sẽ tự động hoàn tồn kho và đồng bộ trạng thái giải quyết yêu cầu trên Dashboard.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-sales-order-guide-btn',
          popover: {
            title: '🎯 Hoàn Tất Hướng Dẫn Bán Hàng & Hóa Đơn',
            description:
              'Bạn đã nắm rõ nghiệp vụ đối soát hóa đơn và thẩm quyền hủy đơn (Void Bill)! Bấm [Hoàn tất & Thoát Sandbox] để đóng hướng dẫn và trở về dữ liệu thật.',
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
        '👑 Bắt đầu Hướng Dẫn Thẩm Qịnh Hóa Đơn Cho Quản Lý!',
        { icon: '🧾', duration: 3000 }
      );
    } catch (e) {
      console.error('Error starting manager sales tour:', e);
      setIsTourActive(false);
    }
  }, [navigate]);

  return {
    startTour,
    stopTour,
    isTourActive,
  };
};
