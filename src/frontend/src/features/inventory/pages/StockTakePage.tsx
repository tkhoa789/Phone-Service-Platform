import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { useBranchStore } from '../../../stores/branchStore';
import toast from 'react-hot-toast';
import { PageHeader } from '../../../components/shared/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useInventoryList, useCreateStockTake } from '../hooks/useInventory';
import { Input } from '@/components/ui/Input';

export const StockTakePage: React.FC = () => {
  const { language } = useThemeStore();
  const { activeBranchName } = useBranchStore();

  const { data: inventoryList = [], isLoading } = useInventoryList();
  const { mutateAsync: createStockTake, isPending: saving } = useCreateStockTake();

  // Local spreadsheet state mapping sku -> actual quantity
  const [stockTakeList, setStockTakeList] = useState<Record<string, number>>({});
  
  // Initialize grid once data loads
  useEffect(() => {
    if (inventoryList.length > 0) {
      const initialStockTake: Record<string, number> = {};
      inventoryList.forEach(item => {
        initialStockTake[item.sku] = item.quantity;
      });
      setStockTakeList(initialStockTake);
    }
  }, [inventoryList]);

  const handleQtyChange = (sku: string, val: string) => {
    const num = parseInt(val, 10);
    setStockTakeList(prev => ({
      ...prev,
      [sku]: isNaN(num) ? 0 : num
    }));
  };

  const handleBulkSave = async () => {
    if (inventoryList.length === 0) return;
    
    // BUSINESS INVARIANT: Submit ALL items for the given warehouse at once.
    const warehouseId = inventoryList[0].warehouseId;
    
    const items = inventoryList.map(item => ({
      productVariantId: item.productVariantId,
      actualQuantity: stockTakeList[item.sku] ?? item.quantity,
    }));

    try {
      await createStockTake({
        warehouseId,
        items
      });
      toast.success(language === 'vi' ? 'Lưu phiếu kiểm kê thành công!' : 'Stock take saved successfully!', { icon: '📝' });
    } catch (e) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader 
        title={language === 'vi' ? 'Kiểm Kê Kho' : 'Stock Take'}
        description={language === 'vi' ? 'Kiểm đếm và cân bằng số lượng tồn kho thực tế' : 'Audit and reconcile physical inventory stock'}
        
        actions={
          <Button
            onClick={handleBulkSave}
            disabled={saving || isLoading}
            loading={saving}
            
          >
            {language === 'vi' ? 'Lưu Phiếu Kiểm' : 'Save Audit'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 flex flex-col justify-center">
          <span className="text-sm font-medium text-slate-500 mb-1">{language === 'vi' ? 'Chi nhánh đang thao tác' : 'Active Branch'}</span>
          <h3 className="font-heading font-bold text-lg text-primary">{activeBranchName || '---'}</h3>
        </Card>
        
        <Card className="p-5 flex flex-col justify-center bg-slate-50 border-slate-200 md:col-span-2">
          <h4 className="font-bold text-slate-700 text-sm mb-1">{language === 'vi' ? 'Hướng dẫn' : 'Instructions'}</h4>
          <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
            <li>{language === 'vi' ? 'Nhập số lượng thực tế đếm được vào cột "Kiểm đếm".' : 'Enter actual counted physical stock in the "Count" column.'}</li>
            <li>{language === 'vi' ? 'Nhấn "Lưu Phiếu Kiểm" để hệ thống tự động tạo các phiếu xuất/nhập cân bằng kho.' : 'Click "Save Audit" to reconcile inventory differences automatically.'}</li>
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 text-sm">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          <span className="font-medium text-slate-700">
            {language === 'vi' ? 'Nhập liệu trực tiếp vào ô số lượng thực tế:' : 'Enter physical quantity directly:'}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3 pl-4">{language === 'vi' ? 'Mã SKU' : 'SKU'}</th>
                <th className="p-3">{language === 'vi' ? 'Tên Sản Phẩm' : 'Product Name'}</th>
                <th className="p-3 text-center">{language === 'vi' ? 'Tồn Hệ Thống' : 'System Qty'}</th>
                <th className="p-3 text-center bg-primary/5 text-primary rounded-t-md">{language === 'vi' ? 'Kiểm Đếm (Thực tế)' : 'Actual Count'}</th>
                <th className="p-3 text-center">{language === 'vi' ? 'Độ Lệch' : 'Variance'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {language === 'vi' ? 'Đang tải danh mục tồn kho...' : 'Loading inventory...'}
                  </td>
                </tr>
              ) : inventoryList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {language === 'vi' ? 'Kho hiện tại trống.' : 'Warehouse is currently empty.'}
                  </td>
                </tr>
              ) : (
                inventoryList.map((item, idx) => {
                  const actualQty = stockTakeList[item.sku] ?? item.quantity;
                  const diff = actualQty - item.quantity;
                  const isModified = diff !== 0;

                  return (
                    <tr key={item.id || `${item.sku}-${idx}`} className={`transition-colors ${isModified ? 'bg-primary/5' : 'hover:bg-slate-50'}`}>
                      <td className="p-3 pl-4 font-mono text-primary font-bold">{item.sku}</td>
                      <td className="p-3 font-medium text-slate-800">{item.variantName}</td>
                      <td className="p-3 text-center font-bold text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="p-2 text-center bg-primary/5">
                        <Input
                          type="number"
                          className="w-24 text-center font-mono font-bold text-primary bg-white border border-primary/20 rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                          value={stockTakeList[item.sku] ?? ''}
                          onChange={(e) => handleQtyChange(item.sku, e.target.value)}
                        />
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        {isModified ? (
                          <span className={diff > 0 ? 'text-emerald-600' : 'text-destructive'}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
