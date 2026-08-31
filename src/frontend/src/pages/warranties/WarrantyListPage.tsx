import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceService } from '../../services/serviceService';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import type { WarrantyTicketDto } from '../../types/api.types';
import { ShieldCheck, Search, CheckCircle2, RefreshCw, Smartphone, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '../../components/common/Pagination';
import { WarrantyReplacementModal } from '../../components/warranties/WarrantyReplacementModal';
import { WarrantyCareLookupWidget } from '../../components/warranties/WarrantyCareLookupWidget';
import { Button } from '@/components/ui/Button';

export const WarrantyListPage: React.FC = () => {
  const { language } = useThemeStore();
  const tWar = i18nDictionary[language].warranties;
  const tCommon = i18nDictionary[language].common;



  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const { data: fetchedWarranties, isLoading: loading, refetch: loadWarranties } = useQuery({
    queryKey: ['warranties', searchTerm],
    queryFn: () => serviceService.getWarranties({ search: searchTerm }),
    staleTime: 5 * 60 * 1000
  });
  const warranties: WarrantyTicketDto[] = React.useMemo(() => {
    if (!fetchedWarranties) return [];
    return Array.isArray((fetchedWarranties as any)?.items) ? (fetchedWarranties as any).items : Array.isArray(fetchedWarranties) ? fetchedWarranties : [];
  }, [fetchedWarranties]);

  // Check IMEI State
  const [checkImei, setCheckImei] = useState('');
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  // Replacement Modal (BR-905)
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyTicketDto | null>(null);

  

  const handleCheckImei = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkImei.trim()) return;
    setChecking(true);
    setCheckResult(null);

    try {
      const res = await serviceService.checkWarrantyStatus(checkImei.trim());
      setCheckResult(res);
    } catch (e: any) {
      toast.error(language === 'vi' ? 'Không tìm thấy thông tin bảo hành cho mã IMEI này!' : 'No warranty record found for this IMEI!');
    } finally {
      setChecking(false);
    }
  };

  const paginatedWarranties = (warranties || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 text-[var(--neu-accent-mint)] font-medium border border-emerald-500/40 whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[100px] shadow-inner border border-border/50 bg-muted/20">{tWar.statusCompleted}</span>;
      case 'Processing':
        return <span className="px-3 py-1.5 rounded-2xl bg-cyan-500/20 text-cyan-400 font-medium border border-cyan-500/30 whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[100px] shadow-inner border border-border/50 bg-muted/20">{tWar.statusProcessing}</span>;
      case 'Rejected':
        return <span className="px-3 py-1.5 rounded-2xl bg-rose-500/20 text-rose-400 font-medium border border-rose-500/30 whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[100px] shadow-inner border border-border/50 bg-muted/20">{tWar.statusRejected}</span>;
      default:
        return <span className="px-3 py-1.5 rounded-2xl bg-purple-500/20 text-purple-400 font-medium border border-purple-500/30 whitespace-nowrap inline-flex items-center justify-center text-center leading-snug min-w-[100px] shadow-inner border border-border/50 bg-muted/20">{tWar.statusReceived}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-[var(--neu-text-sub)]">
      {/* Action Bar */}
      <div className="p-6 rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--neu-bg-base)] shadow-inner border border-border/50 bg-muted/20 flex items-center justify-center text-[var(--neu-accent-mint)] border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-medium text-2xl text-[var(--neu-text-title)] tracking-tight">{tWar.warrantiesTitle}</h1>
            <p className="text-xs text-[var(--neu-text-sub)] mt-0.5 font-normal">{tWar.warrantiesSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Electronic Warranty Verification Portal Widget (AppleCare+ & Samsung Care+ Standard) */}
      <WarrantyCareLookupWidget />

      {/* Warranty Tickets Table */}
      <div className="p-6 rounded-3xl bg-[var(--neu-bg-base)] border border-[var(--neu-border)] shadow-[var(--neu-shadow-outer)] space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--neu-bg-base)] text-[var(--neu-text-title)] uppercase font-medium border-b border-slate-400/20">
              <tr>
                <th className="p-3.5">{tWar.colTicketCode}</th>
                <th className="p-3.5">{tWar.colImeiDevice}</th>
                <th className="p-3.5">{tWar.colCustomer}</th>
                <th className="p-3.5">{tWar.colIssueDesc}</th>
                <th className="p-3.5">{tWar.colStatus}</th>
                <th className="p-3.5 text-right">{tWar.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400/20 text-[var(--neu-text-sub)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-normal">{tCommon.loading}</td>
                </tr>
              ) : paginatedWarranties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-normal">{tWar.emptyWarranties}</td>
                </tr>
              ) : (
                paginatedWarranties.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-500/10 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[var(--neu-accent-mint)]">{w.ticketCode || w.code}</td>
                    <td className="p-3.5 space-y-0.5">
                      <span className="font-mono text-[var(--neu-accent-mint)] block font-bold">{w.imei}</span>
                      <span className="text-[var(--neu-text-title)] font-medium">{w.productName || 'Phone'}</span>
                    </td>
                    <td className="p-3.5 space-y-0.5">
                      <p className="font-medium text-[var(--neu-text-title)] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[var(--neu-accent-mint)]" /> {w.customerName || 'N/A'}
                      </p>
                      <p className="text-[var(--neu-text-sub)] font-mono flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" /> {w.customerPhone || 'N/A'}
                      </p>
                    </td>
                    <td className="p-3.5 max-w-xs text-[var(--neu-text-title)] font-normal truncate" title={w.issueDescription || w.note}>
                      {w.issueDescription || w.note || (language === 'vi' ? 'Không có mô tả' : 'No description')}
                    </td>
                    <td className="p-3.5">{getStatusBadge(w.status)}</td>
                    <td className="p-3.5 text-right space-x-1.5">
                      {w.status !== 'Completed' && (
                        <Button variant="outline"
                          onClick={() => { setSelectedWarranty(w); setShowReplacementModal(true); }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--neu-bg-base)] text-[var(--neu-accent-mint)] border border-emerald-500/30 shadow-[var(--neu-shadow-button)] active:shadow-inner border border-border/50 bg-muted/20 font-medium text-[11px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[var(--neu-accent-mint)]" /> {tWar.btnReplaceDevice}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={(warranties || []).length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Replacement Modal (BR-905) */}
              {showReplacementModal && selectedWarranty && (
          <WarrantyReplacementModal
            warrantyTicketId={selectedWarranty.id}
            rowVersion={selectedWarranty.rowVersion}
            onClose={() => setShowReplacementModal(false)}
            onSuccess={loadWarranties}
          />
        )}
    </div>
  );
};
