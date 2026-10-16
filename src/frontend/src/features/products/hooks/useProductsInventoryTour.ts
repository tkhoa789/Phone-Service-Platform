import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver } from 'driver.js';
import toast from 'react-hot-toast';
import { exitSandboxMode } from '../../../utils/sandboxUtils';
import '../../../styles/driver-theme.css';

export const useProductsInventoryTour = () => {
  const isTourCompleted = useRef(false);
  const navigate = useNavigate();

  const startTour = useCallback(() => {
    isTourCompleted.current = false;
    // 1. Kích hoạt cờ Sandbox đào tạo an toàn
    sessionStorage.setItem('psp_sandbox_mode', 'true');

    // 2. Khởi tạo Driver.js với easing tối ưu và smoothScroll thủ công
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: false,
      duration: 320,
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
      onHighlightStarted: (element) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        // Không cuộn giật màn hình nếu phần tử đã hiển thị rõ ràng trong tầm mắt
        const isComfortablyVisible = rect.top >= 70 && rect.bottom <= (window.innerHeight - 60);
        if (!isComfortablyVisible) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      },
      onHighlighted: (_element, _step, { driver }) => {
        driver.refresh();
        setTimeout(() => driver.refresh(), 120);
        setTimeout(() => driver.refresh(), 280);
      },
      steps: [
        {
          element: '#tour-prd-search-filter',
          popover: {
            title: '🔍 Bộ Lọc & Tra Cứu Danh Mục Linh Kiện',
            description:
              'Chào mừng Thủ kho đến với Danh mục Phụ tùng & Biến thể SKU! Tại đây bạn tra cứu nhanh các linh kiện theo tên máy (iPhone, Samsung) hoặc lọc theo Danh mục (Pin, Màn hình, Bo sạc) trước khi thao tác nhập xuất.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-prd-first-row',
          popover: {
            title: '🏷️ Dòng Linh Kiện Gốc & Tổng Số Biến Thể SKU',
            description:
              'Mỗi dòng sản phẩm lớn đại diện cho một nhóm phụ tùng. Cột [Số Lượng Biến Thể SKU] giúp Thủ kho nắm ngay dòng máy này đang có bao nhiêu quy cách cụ thể (Màu sắc, Dung lượng, Loại linh kiện OEM hay Zin Bóc Máy).',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-prd-expand-btn',
          popover: {
            title: '📑 Bung Chi Tiết Từng Quy Cách (Xem Biến Thể)',
            description:
              'Bấm nút [Xem biến thể SKU] để mở rộng danh sách toàn bộ các mã con thuộc dòng linh kiện này. Bạn có thể kiểm tra từng mã SKU chuẩn hóa, đơn giá niêm yết và thông số kỹ thuật chi tiết.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-prd-barcode-btn',
          popover: {
            title: '🖨️ In Tem Nhãn Mã Vạch Barcode (In Decal Dán Túi Zip)',
            description:
              'Nghiệp vụ cốt lõi của Thủ kho: Khi linh kiện nhập về từ nhà cung cấp chưa có tem, bấm nút [Barcode] để in tem Decal dán lên từng bịch zip. Giúp súng quét mã vạch và nhân viên kỹ thuật quét tít tít trong 1 giây khi nhận hoặc xuất máy.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-prd-add-variant',
          popover: {
            title: '✨ Khai Báo Biến Thể SKU Mới (+ Thêm Biến Thể SKU)',
            description:
              'Khi nhập về một quy cách linh kiện mới chưa từng có trên hệ thống (ví dụ: Pin Dung lượng cao Pisen Dragon), bấm nút này để định danh mã SKU mới trước khi tạo Đơn mua hàng (PO). Chúc bạn quản lý kho trơn tru!',
            side: 'bottom',
            align: 'end',
          },
        },
      ],
    });

    driverObj.drive();
  }, []);

  return { startTour };
};
