import type { RepairTicketStatus } from '../../../types/api.types';

export const getRepairStatusColor = (status: RepairTicketStatus): "default" | "success" | "danger" | "warning" | "info" => {
  switch (status) {
    case 'Received': return 'default';
    case 'Diagnosing': return 'warning';
    case 'WaitingApproval': return 'default';
    case 'WaitingForParts': return 'default';
    case 'Repairing': return 'info';
    case 'WaitingQC': return 'warning';
    case 'Completed': return 'success';
    case 'WaitingPickup': return 'default';
    case 'Delivered': return 'success';
    case 'Cancelled': return 'danger';
    default: return 'default';
  }
};

export const getRepairStatusLabel = (status: RepairTicketStatus, lang: 'vi' | 'en'): string => {
  const map: Record<RepairTicketStatus, { vi: string; en: string }> = {
    Received: { vi: 'Tiếp Nhận', en: 'Received' },
    Diagnosing: { vi: 'Đang Chuẩn Đoán', en: 'Diagnosing' },
    WaitingApproval: { vi: 'Chờ KH Duyệt', en: 'Waiting Approval' },
    WaitingForParts: { vi: 'Chờ Linh Kiện', en: 'Waiting Parts' },
    Repairing: { vi: 'Đang Sửa', en: 'Repairing' },
    WaitingQC: { vi: 'Chờ Kiểm Tra Lại', en: 'Waiting QC' },
    Completed: { vi: 'Đã Hoàn Thành', en: 'Completed' },
    WaitingPickup: { vi: 'Chờ KH Lấy', en: 'Waiting Pickup' },
    Delivered: { vi: 'Đã Giao Máy', en: 'Delivered' },
    Cancelled: { vi: 'Đã Hủy', en: 'Cancelled' }
  };
  return map[status]?.[lang] || status;
};

// Define valid transitions for the UI dropdown
export const getValidTransitions = (status: RepairTicketStatus): RepairTicketStatus[] => {
  switch (status) {
    case 'Received': return ['Diagnosing', 'Cancelled'];
    case 'Diagnosing': return ['WaitingApproval', 'WaitingForParts', 'Repairing', 'Cancelled'];
    case 'WaitingApproval': return ['WaitingForParts', 'Repairing', 'Cancelled'];
    case 'WaitingForParts': return ['Repairing', 'Cancelled'];
    case 'Repairing': return ['WaitingQC', 'Completed'];
    case 'WaitingQC': return ['Completed', 'Repairing']; // QC fail goes back to repairing
    case 'Completed': return ['WaitingPickup', 'Delivered'];
    case 'WaitingPickup': return ['Delivered'];
    case 'Delivered': return [];
    case 'Cancelled': return [];
    default: return [];
  }
};
