import { operationalNotificationService } from '../../../services/operationalNotificationService';
import { salesSandboxService } from '../../sales/services/salesSandboxService';

export interface ManagerApprovalRequest {
  id: string;
  branchId: string;
  branchName: string;
  type: 'VOID_ORDER' | 'STOCK_DISCREPANCY' | 'SPECIAL_PART';
  title: string;
  requesterName: string;
  amount?: number;
  reason: string;
  submittedAt: string;
  targetPath: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  processedAt?: string;
}

const SANDBOX_MANAGER_STORAGE_KEY = 'psp_sandbox_manager_approvals';

export const INITIAL_MANAGER_REQUESTS: ManagerApprovalRequest[] = [
  // ==========================================
  // 1. VOID_ORDER (Hủy Đơn Hàng POS / Bán Lẻ)
  // ==========================================
  {
    id: 'REQ-V01',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'VOID_ORDER',
    title: 'Yêu cầu Hủy Hóa Đơn #SO-2609-0012',
    requesterName: 'Trần Thị Thu Ngân (Sales)',
    amount: 14500000,
    reason: 'Khách đổi ý sang mua iPhone 15 Pro Max 256GB, yêu cầu hủy bill cũ đã in để xuất hóa đơn mới và hoàn tồn kho.',
    submittedAt: '5 phút trước',
    targetPath: '/sales?search=SO-DEMO-01',
    status: 'PENDING',
  },
  {
    id: 'REQ-V02',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'VOID_ORDER',
    title: 'Hủy Bill Bán Lẻ #SO-2609-0034 (Khách đổi màu Titan Tự Nhiên)',
    requesterName: 'Nguyễn Hoàng Nam (Sales)',
    amount: 28900000,
    reason: 'Khách hàng thanh toán qua thẻ tín dụng nhưng quẹt nhầm mã sản phẩm màu Đen, xin hủy hóa đơn hoàn giao dịch POS.',
    submittedAt: '12 phút trước',
    targetPath: '/sales?search=so-demo-03',
    status: 'PENDING',
  },
  {
    id: 'REQ-V03',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'VOID_ORDER',
    title: 'Hủy Hóa Đơn Phụ Kiện #SO-2609-0056 - POS quẹt trùng bill',
    requesterName: 'Lê Thị Mai (Thu ngân)',
    amount: 1250000,
    reason: 'Hệ thống ngân hàng gián đoạn mạng gây in 2 hóa đơn cho cùng 1 đơn hàng cáp sạc Anker & củ sạc nhanh.',
    submittedAt: '25 phút trước',
    targetPath: '/sales?search=so-demo-02',
    status: 'PENDING',
  },
  {
    id: 'REQ-V04',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'VOID_ORDER',
    title: 'Hủy Đơn Sửa Chữa #SO-2609-0078 - Khách từ chối giá phát sinh',
    requesterName: 'Phạm Tuấn Anh (Sales)',
    amount: 3400000,
    reason: 'Khách không đồng ý thay thêm IC nguồn sau khi thợ tháo máy kiểm tra, yêu cầu hoàn cọc và hủy phiếu tiếp nhận.',
    submittedAt: '40 phút trước',
    targetPath: '/sales',
    status: 'PENDING',
  },
  {
    id: 'REQ-V05',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'VOID_ORDER',
    title: 'Hủy Bill #SO-2609-0089 - Nhập nhầm mã phiên bản dung lượng',
    requesterName: 'Đặng Quỳnh Như (Sales)',
    amount: 8200000,
    reason: 'Nhân viên chọn nhầm iPad Gen 10 64GB thành 256GB trên POS bán hàng, đã được khách ký biên bản đính kèm.',
    submittedAt: '1 giờ trước',
    targetPath: '/sales',
    status: 'PENDING',
  },
  {
    id: 'REQ-V06',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'VOID_ORDER',
    title: 'Hủy Hóa Đơn Doanh Nghiệp #SO-2609-0102 - Đổi thông tin MST',
    requesterName: 'Võ Minh Trí (Sales B2B)',
    amount: 45000000,
    reason: 'Công ty đối tác yêu cầu xuất hóa đơn điện tử với tên pháp nhân mới, cần hủy hóa đơn cũ đã phát hành.',
    submittedAt: '2 giờ trước',
    targetPath: '/sales',
    status: 'PENDING',
  },

  // ==========================================
  // 2. STOCK_DISCREPANCY (Lệch Kho & Cân Bằng)
  // ==========================================
  {
    id: 'REQ-S01',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'STOCK_DISCREPANCY',
    title: 'Duyệt Chênh Lệch Kiểm Kê Đợt #ST-Q1-01',
    requesterName: 'Lê Văn Kho (Thủ kho)',
    amount: 4200000,
    reason: 'Lệch -1 Màn hình OLED iPhone 14 do nứt vỡ trong quá trình test máy trước khi thay, đã có biên bản sự cố đính kèm.',
    submittedAt: '15 phút trước',
    targetPath: '/stock-take?tab=audit',
    status: 'PENDING',
  },
  {
    id: 'REQ-S02',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'STOCK_DISCREPANCY',
    title: 'Lệch Kiểm Kê Pin iPhone 13 Pro Max #STK-2026-09A',
    requesterName: 'Trần Bửu (Quản lý kho)',
    amount: 1650000,
    reason: 'Thực tế thừa +1 Pin Pisen do lô hàng điều chuyển tuần trước nhà cung cấp giao bù bảo hành chưa vào sổ.',
    submittedAt: '35 phút trước',
    targetPath: '/stock-take?tab=audit',
    status: 'PENDING',
  },
  {
    id: 'REQ-S03',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'STOCK_DISCREPANCY',
    title: 'Báo Cáo Hao Hụt Cáp & Củ Sạc 20W Đợt Tháng 9',
    requesterName: 'Ngô Quang (Thủ kho)',
    amount: 850000,
    reason: 'Hao hụt -2 Cáp Type-C to Lightning trưng bày trải nghiệm tại quầy bị đứt gãy đầu tiếp xúc sau 6 tháng.',
    submittedAt: '50 phút trước',
    targetPath: '/stock-take?tab=audit',
    status: 'PENDING',
  },
  {
    id: 'REQ-S04',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'STOCK_DISCREPANCY',
    title: 'Lệch Kho Cụm Camera Samsung S23 Ultra #STK-2026-09B',
    requesterName: 'Hoàng Minh (Kỹ thuật trưởng)',
    amount: 3800000,
    reason: 'Thiếu -1 cụm camera do KTV mượn xử lý ca cấp cứu cho khách VIP nhưng chưa kịp lập phiếu xuất kho nội bộ.',
    submittedAt: '1 giờ trước',
    targetPath: '/stock-take?tab=audit',
    status: 'PENDING',
  },
  {
    id: 'REQ-S05',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'STOCK_DISCREPANCY',
    title: 'Đối Soát Lệch 2 Cường Lực KingKong & 1 Ốp MagSafe',
    requesterName: 'Bùi Thị Sen (Kiểm kê viên)',
    amount: 420000,
    reason: 'Hàng quà tặng khuyến mãi theo chương trình Black Friday bị xuất thiếu chứng từ đối trừ tồn kho khuyến mại.',
    submittedAt: '2 giờ trước',
    targetPath: '/stock-take?tab=audit',
    status: 'PENDING',
  },
  {
    id: 'REQ-S06',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'STOCK_DISCREPANCY',
    title: 'Lệch Tồn Thực Tế 1 Màn Hình iPad Pro M2 11 inch',
    requesterName: 'Đỗ Hải (Kỹ thuật phần cứng)',
    amount: 5900000,
    reason: 'Màn hình bị sọc chỉ khi vừa mở seal bóc hộp linh kiện từ NCC TechParts, đề xuất duyệt ghi nhận lệch để đổi trả NCC.',
    submittedAt: '3 giờ trước',
    targetPath: '/stock-take?tab=audit',
    status: 'PENDING',
  },

  // ==========================================
  // 3. SPECIAL_PART (Linh Kiện Giá Trị Cao)
  // ==========================================
  {
    id: 'REQ-P01',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'SPECIAL_PART',
    title: 'Xuất Cụm Màn Hình iPhone 15 Pro Max Zin Bóc Máy',
    requesterName: 'Nguyễn Văn Nam (KTV Trưởng)',
    amount: 8500000,
    reason: 'Phiếu sửa chữa #REP-2609-0089: Khách VIP yêu cầu thay màn hình zin chính hãng bóc máy, khách đã đặt cọc 3.000.000đ.',
    submittedAt: '10 phút trước',
    targetPath: '/repairs?tab=MY_TICKETS',
    status: 'PENDING',
  },
  {
    id: 'REQ-P02',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'SPECIAL_PART',
    title: 'Xuất Mainboard iPad Pro M2 12.9 inch 256GB 5G',
    requesterName: 'Trần Văn Mạnh (KTV Phần Cứng)',
    amount: 12500000,
    reason: 'Phiếu sửa #REP-2609-0112: Thiết bị vô nước biển cong vênh mục mạch, không thể sửa chữa IC, cần thay cả bo mạch chủ.',
    submittedAt: '20 phút trước',
    targetPath: '/repairs?tab=MY_TICKETS',
    status: 'PENDING',
  },
  {
    id: 'REQ-P03',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'SPECIAL_PART',
    title: 'Xuất Màn Hình Trong Gập Samsung Galaxy Z Fold 5',
    requesterName: 'Phạm Đức Toàn (KTV Gập & Ép Kính)',
    amount: 9800000,
    reason: 'Phiếu sửa #REP-2609-0145: Màn hình gập trong bị chảy mực nếp gấp giữa sau 14 tháng sử dụng, đã thẩm định linh kiện tại kho.',
    submittedAt: '30 phút trước',
    targetPath: '/repairs?tab=MY_TICKETS',
    status: 'PENDING',
  },
  {
    id: 'REQ-P04',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'SPECIAL_PART',
    title: 'Cấp Cụm Cáp Face ID & Cảm Biến Ánh Sáng iPhone 14 Pro',
    requesterName: 'Lê Minh Quân (KTV)',
    amount: 2300000,
    reason: 'Cáp FaceID cũ của khách bị đứt ngầm do thợ ngoài cạy trước đó, cần xuất cáp zin đồng bộ mã serial bảo mật Secure Enclave.',
    submittedAt: '45 phút trước',
    targetPath: '/repairs?tab=MY_TICKETS',
    status: 'PENDING',
  },
  {
    id: 'REQ-P05',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'SPECIAL_PART',
    title: 'Xuất Vỏ Khung Titan Tự Nhiên iPhone 15 Pro',
    requesterName: 'Hoàng Anh (KTV Thẩm Mỹ)',
    amount: 4600000,
    reason: 'Phiếu sửa #REP-2609-0188: Máy khách bị tai nạn giao thông móp méo vỏ lưng khung viền, cần xuất vỏ zin hoàn thiện.',
    submittedAt: '1 giờ trước',
    targetPath: '/repairs?tab=MY_TICKETS',
    status: 'PENDING',
  },
  {
    id: 'REQ-P06',
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    type: 'SPECIAL_PART',
    title: 'Xuất Cụm Loa Kép & Rung Taptic Engine Apple Watch Ultra',
    requesterName: 'Vũ Quốc Bảo (KTV Đồng Hồ)',
    amount: 1950000,
    reason: 'Đồng hồ khách đi bơi bị rè loa và liệt rung, đã kiểm tra màng loa bị rách mục cao su chống nước.',
    submittedAt: '2 giờ trước',
    targetPath: '/repairs?tab=MY_TICKETS',
    status: 'PENDING',
  },
];

class ManagerSandboxService {
  private loadRequestsFromStorage(): ManagerApprovalRequest[] {
    try {
      const raw = sessionStorage.getItem(SANDBOX_MANAGER_STORAGE_KEY);
      if (!raw) {
        this.saveRequestsToStorage(INITIAL_MANAGER_REQUESTS);
        return INITIAL_MANAGER_REQUESTS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_MANAGER_REQUESTS;
    }
  }

  private saveRequestsToStorage(requests: ManagerApprovalRequest[]): void {
    try {
      sessionStorage.setItem(SANDBOX_MANAGER_STORAGE_KEY, JSON.stringify(requests));
      window.dispatchEvent(new CustomEvent('psp_sandbox_manager_updated'));
    } catch {
      // ignore
    }
  }

  /**
   * Lấy danh sách yêu cầu chờ duyệt theo phạm vi chi nhánh của Manager
   */
  public getRequests(branchId?: string): ManagerApprovalRequest[] {
    const all = this.loadRequestsFromStorage();
    if (!branchId || branchId === 'all') {
      return all;
    }
    return all.filter((r) => {
      if (r.branchId === branchId) return true;
      if (branchId === 'branch-q1' || branchId.includes('0001')) return true;
      return false;
    });
  }

  /**
   * Lấy chi tiết một yêu cầu theo ID
   */
  public getRequestById(id: string): ManagerApprovalRequest | undefined {
    const all = this.loadRequestsFromStorage();
    return all.find((r) => r.id === id);
  }

  /**
   * Cửa hàng trưởng phê duyệt yêu cầu (Approve)
   * Tự động đồng bộ sang salesSandboxService nếu là VOID_ORDER
   */
  public approveRequest(id: string): ManagerApprovalRequest | null {
    const all = this.loadRequestsFromStorage();
    const targetIndex = all.findIndex((r) => r.id === id);
    if (targetIndex === -1) return null;

    const req = { ...all[targetIndex], status: 'APPROVED' as const, processedAt: new Date().toISOString() };
    all[targetIndex] = req;
    this.saveRequestsToStorage(all);

    // Đồng bộ đa trang nếu là hủy đơn hàng POS
    if (req.type === 'VOID_ORDER') {
      // Nếu có mã đơn mẫu, tự động chuyển đơn sang Cancelled trong salesSandboxService
      if (req.title.includes('SO-2609-0012') || req.id === 'REQ-V01') {
        salesSandboxService.cancelOrder('so-demo-01');
      } else if (req.title.includes('SO-2609-0034') || req.id === 'REQ-V02') {
        salesSandboxService.cancelOrder('so-demo-03');
      } else if (req.title.includes('SO-2609-0056') || req.id === 'REQ-V03') {
        salesSandboxService.cancelOrder('so-demo-02');
      }

      operationalNotificationService.dispatchNotification({
        title: `✅ Quản lý đã DUYỆT yêu cầu Hủy hóa đơn (Sandbox)`,
        content: `${req.title} của ${req.requesterName} đã được phê duyệt. Hệ thống đã tự động hủy đơn và hoàn tồn kho.`,
        type: 'VOID_ORDER_APPROVED',
        targetRoles: ['Sales', 'Manager'],
        branchId: req.branchId,
        branchName: req.branchName,
        link: '/sales',
      });
    } else if (req.type === 'STOCK_DISCREPANCY') {
      operationalNotificationService.dispatchNotification({
        title: `✅ Quản lý đã DUYỆT biên bản Lệch kho (Sandbox)`,
        content: `${req.title} của ${req.requesterName} đã được phê duyệt. Số liệu tồn kho đã được cân bằng chính thức.`,
        type: 'STOCK_DISCREPANCY_APPROVED',
        targetRoles: ['Inventory', 'Manager'],
        branchId: req.branchId,
        branchName: req.branchName,
        link: '/stock-take?tab=audit',
      });
    } else if (req.type === 'SPECIAL_PART') {
      operationalNotificationService.dispatchNotification({
        title: `✅ Quản lý đã DUYỆT xuất Linh kiện đặc biệt (Sandbox)`,
        content: `${req.title} của ${req.requesterName} đã được phê duyệt. Linh kiện đã sẵn sàng cho KTV nhận sửa chữa.`,
        type: 'PART_REQUESTED',
        targetRoles: ['Technician', 'Manager'],
        branchId: req.branchId,
        branchName: req.branchName,
        link: '/repairs?tab=MY_TICKETS',
      });
    }

    return req;
  }

  /**
   * Cửa hàng trưởng từ chối yêu cầu (Reject) kèm lý do
   */
  public rejectRequest(id: string, rejectionReason: string): ManagerApprovalRequest | null {
    const all = this.loadRequestsFromStorage();
    const targetIndex = all.findIndex((r) => r.id === id);
    if (targetIndex === -1) return null;

    const req = {
      ...all[targetIndex],
      status: 'REJECTED' as const,
      rejectionReason,
      processedAt: new Date().toISOString(),
    };
    all[targetIndex] = req;
    this.saveRequestsToStorage(all);

    operationalNotificationService.dispatchNotification({
      title: `❌ Quản lý TỪ CHỐI yêu cầu: ${req.title} (Sandbox)`,
      content: `Lý do: "${rejectionReason}". Nhân viên phụ trách (${req.requesterName}) vui lòng kiểm tra lại chứng từ.`,
      type: 'VOID_ORDER_REJECTED',
      targetRoles: ['Sales', 'Inventory', 'Technician', 'Manager'],
      branchId: req.branchId,
      branchName: req.branchName,
      link: req.targetPath,
    });

    return req;
  }

  /**
   * Đồng bộ khi Manager thao tác hủy đơn trực tiếp tại /sales
   */
  public resolveVoidOrder(orderCodeOrId: string): void {
    const all = this.loadRequestsFromStorage();
    const req = all.find((r) => 
      r.type === 'VOID_ORDER' && 
      r.status === 'PENDING' && 
      (r.title.toLowerCase().includes(orderCodeOrId.toLowerCase()) || r.targetPath.toLowerCase().includes(orderCodeOrId.toLowerCase()))
    );
    if (req) {
      this.approveRequest(req.id);
    }
  }

  /**
   * Đồng bộ khi Manager bấm Cân Bằng Kho tại /stock-take
   */
  public resolveStockDiscrepancy(code?: string): void {
    const all = this.loadRequestsFromStorage();
    const req = all.find((r) => r.type === 'STOCK_DISCREPANCY' && r.status === 'PENDING');
    if (req) {
      this.approveRequest(req.id);
    }
  }

  /**
   * Khôi phục toàn bộ dữ liệu Sandbox của Manager về trạng thái ban đầu
   */
  public resetAll(): void {
    this.saveRequestsToStorage(INITIAL_MANAGER_REQUESTS);
    salesSandboxService.resetToDefault();
    operationalNotificationService.clearSandboxNotifications();
  }
}

export const managerSandboxService = new ManagerSandboxService();
