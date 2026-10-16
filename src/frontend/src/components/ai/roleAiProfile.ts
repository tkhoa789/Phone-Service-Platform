export interface RoleAiProfile {
  roleKey: string;
  title: string;
  badgeColor: string;
  capabilities: string[];
}

export const getRoleAiProfile = (roles: string[]): RoleAiProfile => {
  if (roles.includes('Owner')) {
    return {
      roleKey: 'Owner',
      title: 'Chủ Doanh Nghiệp (Owner)',
      badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      capabilities: [
        '👑 Toàn quyền tra cứu dòng tiền, doanh thu & hiệu suất kinh doanh toàn chuỗi.',
        '📚 Quyền nạp và cập nhật tri thức tài liệu chính sách mới vào Vector DB (Qdrant).',
        '📊 Hỏi đáp phân tích tồn kho, điểm nghẽn chuỗi cung ứng và rủi ro chi nhánh.',
        '🛡️ Giám sát đối soát nhật ký Audit Log và chính sách phân quyền hệ thống.',
      ],
    };
  }
  if (roles.includes('Admin')) {
    return {
      roleKey: 'Admin',
      title: 'Quản Trị Hệ Thống (Admin)',
      badgeColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      capabilities: [
        '⚙️ Tra cứu chính sách cấu hình hệ thống, tham số bảo mật phân quyền RBAC.',
        '📚 Sử dụng công cụ "Nạp tri thức" để đưa tài liệu quy trình vào Vector DB.',
        '📊 Báo cáo kiểm soát vận hành, giám sát Audit Logs và bảo mật tài khoản.',
        '🏢 Tra cứu đối soát hoạt động bán hàng, dịch vụ và kho vận liên chi nhánh.',
      ],
    };
  }
  if (roles.includes('Manager')) {
    return {
      roleKey: 'Manager',
      title: 'Quản Lý Chi Nhánh (Manager)',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      capabilities: [
        '🏢 Tra cứu quy chuẩn vận hành chi nhánh, ca làm việc và phân bổ nhân sự.',
        '📦 Nhận đề xuất giải pháp xử lý mặt hàng chạm ngưỡng tồn kho tối thiểu.',
        '⚖️ Hướng dẫn quy trình xử lý ngoại lệ (khiếu nại, duyệt kiểm kê kho lệch).',
        '🔒 Ranh giới bảo mật: Số liệu lợi nhuận ròng toàn chuỗi chỉ hiển thị cho Ban Giám Đốc (Owner/Admin).',
      ],
    };
  }
  if (roles.includes('Sales')) {
    return {
      roleKey: 'Sales',
      title: 'Chuyên Viên Bán Hàng & Thu Ngân (Sales)',
      badgeColor: 'text-teal-500 bg-teal-500/10 border-teal-500/30',
      capabilities: [
        '📱 Tra cứu thông số kỹ thuật, giá bán niêm yết và tồn kho thực tế tại quầy.',
        '🧾 Hướng dẫn thao tác bán hàng POS, áp dụng mã voucher và xuất hóa đơn K80.',
        '🔄 Tra cứu quy định đổi trả sản phẩm trong 7-30 ngày và ưu đãi hạng thành viên.',
        '🔒 Ranh giới bảo mật: Trợ lý AI không cung cấp giá vốn (COGS) hay số liệu tài chính doanh nghiệp.',
      ],
    };
  }
  if (roles.includes('Technician')) {
    return {
      roleKey: 'Technician',
      title: 'Kỹ Thuật Viên Sửa Chữa (Technician)',
      badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
      capabilities: [
        '🛠️ Hướng dẫn quy trình 5 bước tiếp nhận, chẩn đoán và cập nhật phiếu sửa chữa (#RT-...).',
        '📋 Tra cứu danh mục linh kiện thay thế, checklist kiểm tra máy trước và sau sửa chữa.',
        '⚠️ Tiêu chuẩn an toàn kỹ thuật, quy định niêm phong và chính sách bảo hành sau sửa chữa.',
        '🔒 Ranh giới bảo mật: Trợ lý AI không cung cấp giá vốn linh kiện hay tình hình tài chính doanh nghiệp.',
      ],
    };
  }
  if (roles.includes('Warranty')) {
    return {
      roleKey: 'Warranty',
      title: 'Chuyên Viên Tiếp Nhận Bảo Hành (Warranty)',
      badgeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      capabilities: [
        '🛡️ Tra cứu chính sách bảo hành chính hãng (Apple, Samsung...) theo số IMEI / Serial.',
        '🔍 Hướng dẫn thẩm định điều kiện bảo hành (rơi vỡ, ẩm nước, can thiệp bên ngoài).',
        '🚚 Hướng dẫn quy trình điều phối thiết bị bảo hành lên hãng và bàn giao trả khách.',
        '🔒 Ranh giới bảo mật: Dữ liệu chi phí nội bộ và tài chính chi nhánh khác không thuộc phạm vi tra cứu.',
      ],
    };
  }
  if (roles.includes('Inventory')) {
    return {
      roleKey: 'Inventory',
      title: 'Quản Lý Kho & Cung Ứng (Inventory)',
      badgeColor: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
      capabilities: [
        '📦 Hướng dẫn quy trình kiểm kê định kỳ, quét barcode IMEI và giải trình lệch tồn.',
        '📑 Hướng dẫn tạo và theo dõi tiến độ đơn mua hàng (Purchase Order - PO) với nhà cung cấp.',
        '🚚 Quy định điều chuyển kho hàng nội bộ giữa các chi nhánh hoặc nhận hàng kho tổng.',
        '💵 Tra cứu thông tin giá vốn/giá nhập linh kiện phục vụ công tác đối soát kho bãi.',
      ],
    };
  }
  return {
    roleKey: 'Member',
    title: 'Nhân Viên Nội Bộ',
    badgeColor: 'text-slate-500 bg-slate-500/10 border-slate-500/30',
    capabilities: [
      '📖 Tra cứu nội quy, quy định làm việc và hướng dẫn thao tác hệ thống PSP.',
      '❓ Đặt câu hỏi hỗ trợ nghiệp vụ trong phạm vi quyền hạn được cấp.',
    ],
  };
};
