import { showOperationalToast } from './operationalToast';

export type OperationalNotificationType =
  | 'WARRANTY_RMA_RETURN'
  | 'VOID_ORDER_APPROVED'
  | 'VOID_ORDER_REJECTED'
  | 'REPAIR_ASSIGNED'
  | 'REPAIR_APPROVED'
  | 'REPAIR_COMPLETED'
  | 'LOW_STOCK_ALERT'
  | 'PART_REQUESTED'
  | 'STOCK_DISCREPANCY_APPROVED'
  | 'STOCK_DISCREPANCY_REJECTED'
  | 'GENERAL';

export interface OperationalNotification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  type: OperationalNotificationType;
  targetRoles: string[]; // e.g. ['Warranty'], ['Sales'], ['Technician'], ['Inventory'], ['Manager']
  branchId?: string;
  branchName?: string;
  link?: string;
  isSandbox?: boolean;
}

const STORAGE_KEY = 'psp_operational_notifications_v2';
const SANDBOX_STORAGE_KEY = 'psp_sandbox_notifications_v2';
const EVENT_NAME = 'psp_operational_notification';
const UPDATE_EVENT_NAME = 'psp_notifications_updated';

// Realistic initial seed notifications for demo & operational continuity
// LƯU Ý: Chỉ chứa dữ liệu thật cho hệ thống vận hành live, TUYỆT ĐỐI KHÔNG chứa mã DEMO/Sandbox
const INITIAL_OPERATIONAL_NOTIFICATIONS: OperationalNotification[] = [
  // 1. Warranty & RMA (Phiếu thực tế)
  {
    id: 'op-war-01',
    title: '📦 Máy gửi hãng (RMA) đã quay về chi nhánh!',
    content: 'MacBook Pro 14 M3 Pro (IMEI: C02FJ1ABMD6M, Phiếu: WAR-2609-004) từ Apple Care (AASP) đã hoàn tất thẩm định và gửi về chi nhánh. Sẵn sàng liên hệ bàn giao trả khách!',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    isRead: false,
    type: 'WARRANTY_RMA_RETURN',
    targetRoles: ['Warranty', 'Sales', 'Manager'],
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    link: '/warranties',
    isSandbox: false,
  },
  // 2. Sales
  {
    id: 'op-sal-01',
    title: '🔔 Ca sửa chữa đã hoàn thành - Sẵn sàng thu tiền & giao máy',
    content: 'Phiếu REP-2609-008 (Khách hàng: Trần Văn Nam, iPhone 14 Pro Max) đã hoàn tất kiểm định QC. Thu ngân/Sales liên hệ khách thanh toán số dư 2.450.000₫ và bàn giao máy.',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    isRead: false,
    type: 'REPAIR_COMPLETED',
    targetRoles: ['Sales', 'Manager'],
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    link: '/repairs?status=Completed',
    isSandbox: false,
  },
  {
    id: 'op-sal-02',
    title: '✅ Quản lý đã DUYỆT yêu cầu Hủy hóa đơn #SO-2609-0012',
    content: 'Quản lý chi nhánh đã phê duyệt hủy đơn hàng #SO-2609-0012 (14.500.000₫). Tồn kho máy iPhone 15 Pro Max đã được tự động hoàn lại kho hàng.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isRead: true,
    type: 'VOID_ORDER_APPROVED',
    targetRoles: ['Sales', 'Manager'],
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    link: '/sales',
    isSandbox: false,
  },
  // 3. Technician
  {
    id: 'op-tech-01',
    title: '🛠️ Phân công ca sửa chữa mới: REP-2609-012',
    content: 'Quản lý đã điều phối bạn phụ trách ca sửa chữa Samsung Galaxy S23 Ultra (Lỗi: Mất nguồn, sạc không báo gì). Vui lòng tiếp nhận thiết bị tại khay chờ sửa.',
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    isRead: false,
    type: 'REPAIR_ASSIGNED',
    targetRoles: ['Technician'],
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    link: '/repairs?tab=MY_TICKETS',
    isSandbox: false,
  },
  {
    id: 'op-tech-02',
    title: '⚡ Khách hàng ĐÃ DUYỆT báo giá sửa chữa REP-2609-005',
    content: 'Khách hàng Nguyễn Hoàng Long đã đồng ý thay Cụm màn hình OLED và Pin Pisen (Tổng: 3.200.000₫). KTV tiến hành xuất linh kiện và sửa chữa ngay.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    isRead: false,
    type: 'REPAIR_APPROVED',
    targetRoles: ['Technician'],
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    link: '/repairs?tab=MY_TICKETS',
    isSandbox: false,
  },
  // 4. Inventory
  {
    id: 'op-inv-01',
    title: '⚠️ CẢNH BÁO: Tồn kho Pin iPhone 13 Pro Max chạm đáy!',
    content: 'Sau giao dịch bán lẻ vừa hoàn tất, mặt hàng Pin Pisen iPhone 13 Pro Max chỉ còn 1 cái trong kho (dưới ngưỡng sàn 5 cái). Cần lập đề xuất nhập hàng gấp!',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    isRead: false,
    type: 'LOW_STOCK_ALERT',
    targetRoles: ['Inventory', 'Manager'],
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    link: '/purchase-orders',
    isSandbox: false,
  },
  {
    id: 'op-inv-02',
    title: '📋 Yêu cầu cấp linh kiện sửa chữa từ KTV',
    content: 'KTV Hoàng Minh gửi yêu cầu xuất 01 Màn hình iPhone 14 Pro Max chính hãng cho ca REP-2609-008. Thủ kho kiểm tra xuất vật tư.',
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    isRead: true,
    type: 'PART_REQUESTED',
    targetRoles: ['Inventory'],
    branchId: 'branch-q1',
    branchName: 'Chi Nhánh 1 (Quận 1)',
    link: '/inventory',
    isSandbox: false,
  }
];

class OperationalNotificationService {
  private getStored(isSandboxMode: boolean = false): OperationalNotification[] {
    const key = isSandboxMode ? SANDBOX_STORAGE_KEY : STORAGE_KEY;
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        if (!isSandboxMode) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_OPERATIONAL_NOTIFICATIONS));
          return INITIAL_OPERATIONAL_NOTIFICATIONS;
        }
        return [];
      }
      const parsed: OperationalNotification[] = JSON.parse(data);

      if (!isSandboxMode) {
        // TỰ ĐỘNG LÀM SẠCH (Auto-sanitize): Loại bỏ hoàn toàn mọi dữ liệu thử nghiệm Sandbox/DEMO khỏi kho dữ liệu thật
        const cleaned = parsed.filter(n => {
          if (n.isSandbox) return false;
          if (n.id?.startsWith('op-notif-sbx-') || n.id?.startsWith('demo-')) return false;
          if (n.title?.includes('[SANDBOX]') || n.title?.includes('DEMO')) return false;
          if (
            n.content?.includes('WAR-DEMO') ||
            n.content?.includes('REP-DEMO') ||
            n.content?.includes('(Học viên Demo)') ||
            n.content?.includes('[Mô phỏng thực hành]')
          ) {
            return false;
          }
          return true;
        });

        if (cleaned.length !== parsed.length) {
          this.saveStored(cleaned, false);
        }
        return cleaned;
      }

      return parsed;
    } catch {
      return isSandboxMode ? [] : INITIAL_OPERATIONAL_NOTIFICATIONS;
    }
  }

  private saveStored(items: OperationalNotification[], isSandboxMode: boolean = false) {
    const key = isSandboxMode ? SANDBOX_STORAGE_KEY : STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {
      console.warn(`Failed to save operational notifications (${key}) to localStorage`, e);
    }
  }

  /**
   * Lấy danh sách thông báo theo role của người dùng hiện tại và chi nhánh
   * isSandboxMode: false = chỉ lấy thông báo THẬT; true = chỉ lấy thông báo THỰC HÀNH SANDBOX
   */
  public getNotifications(userRoles: string[] = [], branchId?: string, isSandboxMode: boolean = false): OperationalNotification[] {
    const all = this.getStored(isSandboxMode);

    return all.filter(notif => {
      // 1. Tuyệt đối ngăn chặn dữ liệu Sandbox lọt vào kho dữ liệu thật
      if (!isSandboxMode && notif.isSandbox) return false;

      // 2. Kiểm tra quyền Role: Warranty, Sales, Technician, Inventory, Manager
      const roleMatch = userRoles.some(r => notif.targetRoles.includes(r));
      if (!roleMatch) return false;

      // 3. Kiểm tra Chi nhánh
      if (branchId && notif.branchId && branchId !== 'all') {
        const normUserBranch = branchId.toLowerCase();
        const normNotifBranch = notif.branchId.toLowerCase();
        const branchMatched = normUserBranch === normNotifBranch || normNotifBranch.includes(normUserBranch) || normUserBranch.includes(normNotifBranch);
        if (!branchMatched && !notif.id.startsWith('op-')) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Lấy số lượng thông báo chưa đọc (Mặc định chỉ tính dữ liệu thật)
   */
  public getUnreadCount(userRoles: string[] = [], branchId?: string, isSandboxMode: boolean = false): number {
    return this.getNotifications(userRoles, branchId, isSandboxMode).filter(n => !n.isRead).length;
  }

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  public markAsRead(id: string, isSandboxMode: boolean = false) {
    const all = this.getStored(isSandboxMode);
    const updated = all.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.saveStored(updated, isSandboxMode);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
  }

  /**
   * Đánh dấu tất cả thông báo thuộc quyền xem là đã đọc
   */
  public markAllAsRead(userRoles: string[] = [], branchId?: string, isSandboxMode: boolean = false) {
    const visible = this.getNotifications(userRoles, branchId, isSandboxMode);
    const visibleIds = new Set(visible.map(v => v.id));

    const all = this.getStored(isSandboxMode);
    const updated = all.map(n => visibleIds.has(n.id) ? { ...n, isRead: true } : n);
    this.saveStored(updated, isSandboxMode);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
  }

  /**
   * Xóa 1 thông báo
   */
  public deleteNotification(id: string, isSandboxMode: boolean = false) {
    const all = this.getStored(isSandboxMode);
    const updated = all.filter(n => n.id !== id);
    this.saveStored(updated, isSandboxMode);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
  }

  /**
   * Dọn dẹp toàn bộ thông báo
   */
  public clearAll(isSandboxMode: boolean = false) {
    this.saveStored([], isSandboxMode);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
  }

  /**
   * Xóa sạch toàn bộ thông báo Sandbox
   */
  public clearSandboxNotifications() {
    this.saveStored([], true);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
  }

  /**
   * Bắn phát sinh một thông báo nghiệp vụ
   * ĐẶC BIỆT: Nếu là Sandbox, chỉ lưu vào bộ nhớ Sandbox, KHÔNG BAO GIỜ làm ô nhiễm kho dữ liệu thật!
   */
  public dispatchNotification(params: {
    title: string;
    content: string;
    type: OperationalNotificationType;
    targetRoles: string[];
    branchId?: string;
    branchName?: string;
    link?: string;
    silentToast?: boolean;
    isSandbox?: boolean;
  }): OperationalNotification {
    const isSandbox = Boolean(
      params.isSandbox ||
      params.title?.includes('[SANDBOX]') ||
      params.title?.includes('DEMO') ||
      params.content?.includes('WAR-DEMO') ||
      params.content?.includes('REP-DEMO') ||
      params.content?.includes('DEMO-') ||
      params.content?.includes('(Học viên Demo)')
    );

    const newNotif: OperationalNotification = {
      id: `op-notif-${isSandbox ? 'sbx-' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: params.title,
      content: params.content,
      createdAt: new Date().toISOString(),
      isRead: false,
      type: params.type,
      targetRoles: params.targetRoles,
      branchId: params.branchId,
      branchName: params.branchName,
      link: params.link,
      isSandbox,
    };

    if (isSandbox) {
      // Lưu vào kho riêng biệt của Sandbox, TUYỆT ĐỐI KHÔNG ghi vào kho thật
      const sbx = this.getStored(true);
      sbx.unshift(newNotif);
      this.saveStored(sbx, true);
    } else {
      // Lưu vào kho dữ liệu thật
      const all = this.getStored(false);
      all.unshift(newNotif);
      this.saveStored(all, false);
    }

    // Bắn browser custom event
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newNotif }));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));

    // Hiển thị Toast thông báo
    if (!params.silentToast) {
      showOperationalToast({
        id: newNotif.id,
        title: newNotif.title,
        content: newNotif.content,
        type: newNotif.type,
        link: newNotif.link,
        isSandbox,
      });
    }

    return newNotif;
  }
}

export const operationalNotificationService = new OperationalNotificationService();
