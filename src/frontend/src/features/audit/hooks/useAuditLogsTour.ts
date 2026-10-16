import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useAuditLogsTour = () => {
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
          element: '#tour-audit-header',
          popover: {
            title: '🛡️ Nhật Ký Kiểm Toán & Chống Gian Lận (Audit Trail)',
            description:
              'Chào mừng Cửa hàng trưởng! Đây là "hộp đen số" lưu trữ bất biến (immutable) toàn bộ dấu vết thao tác của nhân sự chi nhánh: thời gian, tài khoản, thực thể và hành động (Thêm, Sửa, Xóa, Duyệt).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-audit-search',
          popover: {
            title: '🔍 Bộ Lọc & Tìm Kiếm Dấu Vết Số (Digital Footprint Search)',
            description:
              'Tìm kiếm nhanh theo tên nhân viên, mã bảng (SalesOrder, StockTake, RepairTicket) hoặc hành vi: Update, Delete. Định kỳ cuối ca trực, Manager tìm kiếm từ khóa nhạy cảm để phát hiện sai phạm.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-audit-table',
          popover: {
            title: '📋 Bảng Lịch Sử Thao Tác Toàn Hệ Thống',
            description:
              'Mỗi dòng ghi nhận chính xác giây phát sinh, người thao tác và hành động trên hệ thống. Dữ liệu tại đây được bảo vệ cấp CSDL và không một ai (kể cả nhân viên hay quản lý) có thể sửa hoặc xóa log.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-audit-diff-btn',
          popover: {
            title: '🔬 JSON Diff Inspector - Soi Chi Tiết Before / After',
            description:
              'Bấm nút "Xem Chi Tiết" để mở bảng so sánh dữ liệu gốc (Old Values) và dữ liệu mới (New Values). Đây là công cụ mạnh nhất giúp bạn vạch trần các trường hợp tự ý giảm giá, sửa số IMEI hoặc thay đổi số lượng tồn kho!',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-audit-guide-btn',
          popover: {
            title: '🎯 Hoàn Tất Hướng Dẫn Kiểm Toán & Chống Gian Lận',
            description:
              'Bạn đã nắm rõ cách truy vết dấu vết số và soi JSON Diff phát hiện sửa giá, chiết khấu sai quy định! Bấm [Hoàn tất & Thoát Sandbox] để đóng hướng dẫn và trở về dữ liệu thật.',
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
        '👑 Bắt đầu Hướng Dẫn Kiểm Toán & Phòng Chống Gian Lận!',
        { icon: '🛡️', duration: 3000 }
      );
    } catch (e) {
      console.error('Error starting audit tour:', e);
      setIsTourActive(false);
    }
  }, [navigate]);

  return {
    startTour,
    stopTour,
    isTourActive,
  };
};
