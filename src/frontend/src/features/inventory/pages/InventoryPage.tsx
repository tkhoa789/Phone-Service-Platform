import React, { useState } from 'react';
import { Warehouse, Search, AlertTriangle, CheckCircle2, ClipboardCheck, ArrowRightLeft, Filter, Truck } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { i18nDictionary } from '../../../locales/dictionary';
import { Pagination } from '../../../components/common/Pagination';
import { StockAuditModal } from '../components/StockAuditModal';
import { WarehouseTransferModal } from '../components/WarehouseTransferModal';
import { TransferTrackerModal } from '../components/TransferTrackerModal';
import { useInventoryList, useWarehouses } from '../hooks/useInventory';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { InventoryDto } from '../../../types/api.types';


export const InventoryPage: React.FC = () => {
  const { language } = useThemeStore();
  const tInv = i18nDictionary[language].inventory;
  const tCommon = i18nDictionary[language].common;

  const { data: inventories = [], isLoading } = useInventoryList();
  const { data: apiWarehouses = [] } = useWarehouses();

  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedAuditItem, setSelectedAuditItem] = useState<InventoryDto | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);

  // Fallback if warehouses API is empty
  const branches = apiWarehouses.length > 0 ? apiWarehouses : [
    { id: 'b1', name: 'Trụ sở chính (HQ)' },
    { id: 'b2', name: 'Chi nhánh Quận 1' },
    { id: 'b3', name: 'Chi nhánh Thủ Đức' },
  ];

  // Client-side filtering & pagination (TECHNICAL DEBT / TEMPORARY COMPATIBILITY)
  const filteredInventories = inventories.filter(inv => {
    if (showLowStockOnly && !inv.isLowStock) return false;
    if (selectedBranchId !== 'all' && inv.warehouseId !== selectedBranchId) return false;
    if (searchTerm && !inv.variantName.toLowerCase().includes(searchTerm.toLowerCase()) && !inv.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const paginatedInventories = filteredInventories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: tInv.colVariantName,
      accessor: (inv: InventoryDto) => <span className="font-medium">{inv.variantName}</span>
    },
    {
      header: tInv.colSku,
      accessor: (inv: InventoryDto) => <span className="font-mono font-bold text-primary">{inv.sku}</span>
    },
    {
      header: tInv.colAvailableStock,
      accessor: (inv: InventoryDto) => <span className="font-bold text-primary">{inv.quantity}</span>,
      className: 'text-center'
    },
    {
      header: tInv.colMinStock,
      accessor: (inv: InventoryDto) => <span className="font-mono text-slate-500">{inv.minimumStock || 5}</span>,
      className: 'text-center'
    },
    {
      header: tInv.colStockStatus,
      accessor: (inv: InventoryDto) => inv.isLowStock ? (
        <Badge variant="warning"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> {tInv.statusLowStock}</Badge>
      ) : (
        <Badge variant="success"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {tInv.statusSafe}</Badge>
      ),
      className: 'text-center'
    },
    {
      header: language === 'vi' ? 'Thao Tác' : 'Actions',
      accessor: (inv: InventoryDto) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedAuditItem(inv)}
            
          >
            {language === 'vi' ? 'Kiểm Kho' : 'Audit'}
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader 
        title={tInv.inventoryTitle || "Kho Hàng"}
        description={tInv.inventorySubtitle || "Quản lý tồn kho"}
        
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowTrackerModal(true)}
              
            >
              {language === 'vi' ? 'Theo Dõi Vận Chuyển' : 'Transfer Tracker'}
            </Button>
            <Button
              onClick={() => setShowTransferModal(true)}
              
            >
              {language === 'vi' ? 'Luân Chuyển Hàng' : 'Transfer Stock'}
            </Button>
          </>
        }
      />

      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder={tInv.searchPlaceholder}
            className="flex-1"
          />

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => { setSelectedBranchId(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto"
            >
              <option value="all">⚡ {language === 'vi' ? 'Tất cả Kho Chi Nhánh' : 'All Branch Warehouses'}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <Button
            variant={showLowStockOnly ? 'primary' : 'outline'}
            onClick={() => { setShowLowStockOnly(!showLowStockOnly); setCurrentPage(1); }}
            className={showLowStockOnly ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}
            
          >
            {language === 'vi' ? 'Hàng Sắp Hết Kho (< Định Mức)' : 'Low Stock Alert'}
          </Button>
        </div>

        
        <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="p-3">{tInv.colVariantName || 'Sản Phẩm'}</th>
                <th className="p-3">{tInv.colSku || 'SKU'}</th>
                <th className="p-3 text-center">{tInv.colAvailableStock || 'Tồn Kho'}</th>
                <th className="p-3 text-center">{tInv.colMinStock || 'Định Mức'}</th>
                <th className="p-3 text-center">{tInv.colStockStatus || 'Trạng Thái'}</th>
                <th className="p-3 text-right">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr>
              ) : paginatedInventories.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">{tInv.emptyInventory || 'Trống'}</td></tr>
              ) : (
                paginatedInventories.map((inv: InventoryDto) => (
                  <tr key={inv.sku} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{inv.variantName}</td>
                    <td className="p-3 font-mono font-bold text-primary">{inv.sku}</td>
                    <td className="p-3 text-center font-bold text-primary">{inv.quantity}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{inv.minimumStock || 5}</td>
                    <td className="p-3 text-center">
                      {inv.isLowStock ? (
                        <Badge variant="warning"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> {tInv.statusLowStock || 'Sắp hết'}</Badge>
                      ) : (
                        <Badge variant="success"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {tInv.statusSafe || 'Đủ hàng'}</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedAuditItem(inv)}>
                        <ClipboardCheck className="w-4 h-4 mr-2" /> {language === 'vi' ? 'Kiểm Kho' : 'Audit'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>


        <Pagination
          currentPage={currentPage}
          totalItems={filteredInventories.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </Card>

      {selectedAuditItem && (
        <StockAuditModal
          inventoryItem={selectedAuditItem}
          onClose={() => setSelectedAuditItem(null)}
          onSuccess={() => { /* In a real app this would trigger invalidateQueries but audit is mock */ }}
        />
      )}

      {showTransferModal && (
        <WarehouseTransferModal
          branches={branches}
          inventoryList={inventories}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {}}
        />
      )}

      {showTrackerModal && (
        <TransferTrackerModal
          onClose={() => setShowTrackerModal(false)}
          onRefreshInventory={() => {}}
        />
      )}
    </div>
  );
};
