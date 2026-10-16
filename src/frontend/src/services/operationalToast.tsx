import React from 'react';
import toast from 'react-hot-toast';
import { X, ArrowRight, GraduationCap } from 'lucide-react';
import type { OperationalNotificationType } from './operationalNotificationService';

export function showOperationalToast(params: {
  id: string;
  title: string;
  content: string;
  type: OperationalNotificationType;
  link?: string;
  isSandbox?: boolean;
}) {
  let icon = '🔔';
  if (params.isSandbox) {
    icon = '🎓';
  } else {
    switch (params.type) {
      case 'WARRANTY_RMA_RETURN':
        icon = '📦';
        break;
      case 'VOID_ORDER_APPROVED':
      case 'STOCK_DISCREPANCY_APPROVED':
        icon = '✅';
        break;
      case 'VOID_ORDER_REJECTED':
      case 'STOCK_DISCREPANCY_REJECTED':
        icon = '❌';
        break;
      case 'REPAIR_ASSIGNED':
      case 'REPAIR_APPROVED':
      case 'PART_REQUESTED':
        icon = '🛠️';
        break;
      case 'REPAIR_COMPLETED':
        icon = '🎉';
        break;
      case 'LOW_STOCK_ALERT':
        icon = '⚠️';
        break;
    }
  }

  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-in fade-in slide-in-from-top-2' : 'animate-out fade-out slide-out-to-top-2'
        } max-w-sm sm:max-w-md w-full bg-card/95 backdrop-blur-md text-foreground shadow-2xl rounded-2xl pointer-events-auto flex items-start border ${
          params.isSandbox ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/20' : 'border-border/80 ring-1 ring-black/5 dark:ring-white/10'
        } p-3.5 gap-3 transition-all duration-200`}
      >
        <div className="text-xl shrink-0 mt-0.5 select-none">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <p className="text-xs font-bold text-foreground font-heading leading-tight line-clamp-1">
              {params.title}
            </p>
          </div>
          {params.isSandbox && (
            <div className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 my-1">
              <GraduationCap className="w-2.5 h-2.5" />
              <span>Chế độ thực hành - Không lưu vào chuông thật</span>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-3">
            {params.content}
          </p>
          {params.link && (
            <div className="mt-2 pt-1 border-t border-border/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id);
                  window.dispatchEvent(new CustomEvent('psp_navigate', { detail: params.link }));
                }}
                className="text-[10px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Xem chi tiết điều hướng</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[9px] text-muted-foreground font-mono">
                {params.isSandbox ? 'Mô phỏng đào tạo' : 'Bấm chuông để xem lại'}
              </span>
            </div>
          )}
        </div>
        {/* Nút X tắt thông báo */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="shrink-0 w-6 h-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors cursor-pointer border border-border/40"
          title="Đóng thông báo (X)"
          aria-label="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
    {
      id: params.id,
      duration: 7000,
      position: 'top-right',
    }
  );
}
