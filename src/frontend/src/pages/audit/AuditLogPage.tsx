import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '../../services/auditLogService';
import type { AuditLogDto } from '../../types/api.types';
import { ShieldAlert, Search, Eye, Calendar, User, Database, Code, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Pagination } from '../../components/common/Pagination';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const AuditLogPage: React.FC = () => {
  const { data, isLoading: loading, refetch: loadLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogService.getAll()
  });
  const logs = Array.isArray(data) ? data : [];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Log for JSON Diff Viewer Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const { language } = useThemeStore();
  const t = i18nDictionary[language].auditLogs;

  

  const filteredLogs = logs.filter((l) => {
    const performed = l.performedBy || l.userFullName || '';
    return (
      l.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      performed.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatJson = (jsonStr?: string) => {
    if (!jsonStr) return t.noData;
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  return (
    <div className="space-y-5 font-sans text-foreground">
      {/* Top Bar */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl"
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border) / 0.5)",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818cf8',
            }}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="font-heading text-lg"
              style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
            >
              {t.auditTitle}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t.auditSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none transition-all"
          style={{
            backgroundColor: "hsl(var(--card))",
            border: '1px solid rgba(148,163,184,0.35)',
            boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
            color: "hsl(var(--foreground))",
          }}
        />
      </div>

      {/* Audit Log Table Card */}
      <div
        className="rounded-3xl overflow-hidden p-4 space-y-3"
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border) / 0.5)",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              style={{
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                borderBottom: '1px solid rgba(148,163,184,0.18)',
              }}
            >
              <tr className="uppercase font-medium">
                <th className="p-3.5">{t.colTime}</th>
                <th className="p-3.5">{t.colTable}</th>
                <th className="p-3.5">{t.colAction}</th>
                <th className="p-3.5">{t.colPerformedBy}</th>
                <th className="p-3.5 text-right">{t.colJsonDiff}</th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{
                color: "hsl(var(--foreground))",
                borderColor: 'rgba(148,163,184,0.12)',
              }}
            >
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {t.loading}
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {t.emptyLogs}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors"
                    style={{ '--row-hover': 'rgba(148,163,184,0.06)' } as React.CSSProperties}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(148,163,184,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="p-3.5 font-mono text-muted-foreground">
                      {new Date(log.createdDate || log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="p-3.5 font-medium flex items-center gap-1.5 text-foreground">
                      <Database className="w-3.5 h-3.5" style={{ color: '#818cf8' }} />
                      {log.entityName}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-2xl font-mono font-medium text-[11px] ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : log.action === 'UPDATE'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                        style={{ boxShadow: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)" }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {log.performedBy || log.userFullName || t.systemAdmin}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button variant="outline"
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 rounded-xl font-medium transition-all inline-flex items-center gap-1.5 hover:opacity-80"
                        style={{
                          backgroundColor: "hsl(var(--card))",
                          color: "hsl(var(--primary))",
                          border: '1px solid rgba(16,185,129,0.28)',
                          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t.btnViewDiff}
                      </Button>
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
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* JSON Diff Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-3xl rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border) / 0.5)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              color: "hsl(var(--foreground))",
            }}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
            >
              <div>
                <h3
                  className="font-heading text-base flex items-center gap-2"
                  style={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
                >
                  <Code className="w-5 h-5" style={{ color: '#818cf8' }} />
                  {t.diffModalTitle}
                </h3>
                <p className="text-xs mt-0.5 text-muted-foreground">
                  {t.diffEntity}{' '}
                  <span className="font-medium text-foreground">
                    {selectedLog.entityName}
                  </span>{' '}
                  | {t.diffAction}{' '}
                  <span className="font-mono text-primary">
                    {selectedLog.action}
                  </span>
                </p>
              </div>
              <Button variant="outline"
                onClick={() => setSelectedLog(null)}
                className="p-1 transition-opacity hover:opacity-70 text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Old Value */}
              <div className="space-y-1">
                <h4 className="font-medium text-xs text-amber-400">{t.oldValueLabel}</h4>
                <pre className="p-3.5 rounded-2xl text-[11px] font-mono text-amber-200 overflow-x-auto max-h-64"
                  style={{
                    background: 'rgba(2,6,23,0.5)',
                    border: '1px solid rgba(51,65,85,0.5)',
                  }}
                >
                  {formatJson(selectedLog.oldValues || selectedLog.oldValue)}
                </pre>
              </div>

              {/* New Value */}
              <div className="space-y-1">
                <h4 className="font-medium text-xs text-emerald-400">{t.newValueLabel}</h4>
                <pre className="p-3.5 rounded-2xl text-[11px] font-mono text-emerald-200 overflow-x-auto max-h-64"
                  style={{
                    background: 'rgba(2,6,23,0.5)',
                    border: '1px solid rgba(51,65,85,0.5)',
                  }}
                >
                  {formatJson(selectedLog.newValues || selectedLog.newValue)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border) / 0.5)",
                  boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
                  color: "hsl(var(--foreground))",
                }}
              >
                {i18nDictionary[language].common.close}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
