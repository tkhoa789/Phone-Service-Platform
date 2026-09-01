import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../components/shared/PageHeader';
import { SearchInput } from '../../../components/shared/SearchInput';
import { DataTable } from '../../../components/shared/DataTable';
import { AppPagination } from '../../../components/shared/AppPagination';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useThemeStore } from '@/stores/themeStore';
import { useRepairs, useUpdateRepairStatus } from '../api/useRepairs';
import { getRepairStatusColor, getRepairStatusLabel, getValidTransitions } from '../utils/statusUtils';
import type { RepairTicketDto, RepairTicketStatus } from '@/types/api.types';
import toast from 'react-hot-toast';
import { Wrench, Printer, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';

import { RepairK80ReceiptModal } from '../components/RepairK80ReceiptModal';
import { AppleCareProgressModal } from '../components/AppleCareProgressModal';
import { RepairChecklistModal } from '../components/RepairChecklistModal';
import { AddRepairPartModal } from '../components/AddRepairPartModal';

export const RepairListPage: React.FC = () => {
  const { language } = useThemeStore();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useRepairs({ pageIndex: page, pageSize: 10, search });
  const updateStatus = useUpdateRepairStatus();

  const [selectedPrint, setSelectedPrint] = useState<RepairTicketDto | null>(null);
  const [selectedTracker, setSelectedTracker] = useState<RepairTicketDto | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<RepairTicketDto | null>(null);
  const [selectedPart, setSelectedPart] = useState<RepairTicketDto | null>(null);

  const handleStatusChange = (ticketId: string, newStatus: RepairTicketStatus) => {
    updateStatus.mutate(
      { id: ticketId, status: newStatus },
      {
        onSuccess: () => toast.success(language === 'vi' ? 'Cập nhật trạng thái thành công' : 'Status updated'),
        onError: () => toast.error(language === 'vi' ? 'Không thể cập nhật trạng thái' : 'Failed to update status')
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={language === 'vi' ? 'Quản Lý Sửa Chữa' : 'Repair Management'}
        description={language === 'vi' ? 'Quản lý phiếu tiếp nhận, sửa chữa, thay thế linh kiện' : 'Manage repair tickets and parts replacement'}
        actions={<Button variant="primary" onClick={() => navigate('/repairs/intake')}><Plus className="w-4 h-4 mr-2" />{language === 'vi' ? 'Tạo Phiếu Mới' : 'New Repair'}</Button>}
      />

      <div className="flex gap-4 items-center max-w-sm">
        <SearchInput
          placeholder={language === 'vi' ? 'Tìm mã phiếu, tên KH, SĐT...' : 'Search ticket, customer, phone...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable isLoading={isLoading} isEmpty={!data?.items?.length} emptyTitle={language === 'vi' ? 'Không có phiếu sửa chữa nào' : 'No repair tickets found'}>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Mã Phiếu' : 'Ticket ID'}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Khách Hàng' : 'Customer'}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Thiết Bị' : 'Device'}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Tổng Phí' : 'Total Cost'}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {(data?.items || []).map((r: RepairTicketDto, idx: number) => (
              <tr key={r.id || idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{r.ticketCode}</div>
                  <div className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{r.customerName}</div>
                  <div className="text-xs text-slate-500">{r.customerPhone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{r.productName || r.deviceModel || 'Unknown Device'}</div>
                  <div className="text-xs text-slate-500">{r.imei || r.productSku || 'N/A'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-emerald-600">{(r.totalAmount || r.totalCost || 0).toLocaleString()} ₫</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 items-start">
                    <Badge variant={getRepairStatusColor(r.status)}>{getRepairStatusLabel(r.status, language)}</Badge>
                    {getValidTransitions(r.status).length > 0 && (
                      <Select className="h-7 text-xs w-full min-w-[120px] mt-1" value="" onChange={(e) => handleStatusChange(r.id, e.target.value as RepairTicketStatus)} disabled={updateStatus.isPending}>
                        <option value="" disabled>{language === 'vi' ? 'Chuyển...' : 'Change...'}</option>
                        {getValidTransitions(r.status).map(ts => (
                          <option key={ts} value={ts}>{getRepairStatusLabel(ts, language)}</option>
                        ))}
                      </Select>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setSelectedPrint(r)}><Printer className="w-4 h-4" /></Button>
                    <Button variant="outline" onClick={() => setSelectedTracker(r)}><ShieldCheck className="w-4 h-4" /></Button>
                    <Button variant="outline" onClick={() => setSelectedChecklist(r)}><CheckCircle2 className="w-4 h-4" /></Button>
                    {['Diagnosing', 'Repairing', 'WaitingForParts'].includes(r.status) && (
                      <Button variant="primary" onClick={() => setSelectedPart(r)}><Wrench className="w-4 h-4" /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTable>

      {data?.totalCount && data.totalCount > 10 && (
        <AppPagination
          currentPage={page}
          totalItems={data.totalCount}
          pageSize={10}
          onPageChange={setPage}
        />
      )}

      {selectedPrint && (
        <RepairK80ReceiptModal
          ticket={selectedPrint}
          onClose={() => setSelectedPrint(null)}
        />
      )}
      {selectedTracker && (
        <AppleCareProgressModal
          ticket={selectedTracker as any}
          onClose={() => setSelectedTracker(null)}
        />
      )}
      {selectedChecklist && (
        <RepairChecklistModal
          ticket={selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
          onSuccess={() => {}}
        />
      )}
      {selectedPart && (
        <AddRepairPartModal
          repairTicketId={selectedPart.id}
          onClose={() => setSelectedPart(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};
