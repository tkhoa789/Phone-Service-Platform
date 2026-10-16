import React, { useState, useMemo } from 'react';
import { Search, Layers, PackageCheck } from 'lucide-react';
import { useThemeStore } from '../../../stores/themeStore';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export interface BatchSelectedItem {
  sku: string;
  variantName: string;
  transferQuantity: number;
  productVariantId?: string;
}

interface BatchProductSelectModalProps {
  inventoryList: Array<{ variantName: string; sku: string; quantity: number; productVariantId?: string }>;
  initialSelectedItems: BatchSelectedItem[];
  onClose: () => void;
  onConfirm: (items: BatchSelectedItem[]) => void;
}

export const BatchProductSelectModal: React.FC<BatchProductSelectModalProps> = ({
  inventoryList,
  initialSelectedItems,
  onClose,
  onConfirm,
}) => {
  const { language } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [itemsMap, setItemsMap] = useState<Record<string, { selected: boolean; qty: number }>>(() => {
    const map: Record<string, { selected: boolean; qty: number }> = {};
    initialSelectedItems.forEach(item => {
      map[item.sku] = { selected: true, qty: item.transferQuantity };
    });
    return map;
  });

  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return inventoryList;
    const lower = searchTerm.toLowerCase();
    return inventoryList.filter(
      item => item.variantName.toLowerCase().includes(lower) || item.sku.toLowerCase().includes(lower)
    );
  }, [inventoryList, searchTerm]);

  const toggleSelect = (sku: string) => {
    setItemsMap(prev => {
      const current = prev[sku] || { selected: false, qty: 1 };
      return { ...prev, [sku]: { ...current, selected: !current.selected } };
    });
  };

  const updateQuantity = (sku: string, qty: number, maxQty: number) => {
    let validQty = isNaN(qty) ? 1 : qty;
    if (validQty < 1) validQty = 1;
    if (validQty > maxQty) validQty = maxQty;
    
    setItemsMap(prev => ({
      ...prev,
      [sku]: { ...(prev[sku] || { selected: true }), qty: validQty }
    }));
  };

  const handleConfirm = () => {
    const results: BatchSelectedItem[] = [];
    inventoryList.forEach(item => {
      const state = itemsMap[item.sku];
      if (state?.selected) {
        results.push({
          sku: item.sku,
          variantName: item.variantName,
          transferQuantity: state.qty,
          productVariantId: item.productVariantId,
        });
      }
    });
    onConfirm(results);
  };

  const selectedCount = Object.values(itemsMap).filter(x => x.selected).length;

  return (
    <Dialog 
      open={true} 
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={language === 'vi' ? 'Chọn Danh Sách Sản Phẩm Theo Lô' : 'Bulk Batch Product Selector'}
      description={language === 'vi' ? 'Tích chọn nhiều sản phẩm và tùy chỉnh số lượng luân chuyển đồng thời' : 'Multi-select items & adjust quantities'}
      className="max-w-3xl h-[80vh] flex flex-col"
    >
      <div className="flex flex-col h-full gap-4 pt-4">
        <Input
          
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={language === 'vi' ? 'Tìm kiếm tên sản phẩm, mã SKU...' : 'Search by name or SKU...'}
          className="shrink-0"
        />

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-2">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              {language === 'vi' ? 'Không tìm thấy sản phẩm phù hợp trong kho' : 'No matching products in warehouse'}
            </div>
          ) : (
            filteredList.map((item, idx) => {
              const state = itemsMap[item.sku] || { selected: false, qty: 1 };

              return (
                <Card
                  key={`${item.sku}-${idx}`}
                  className={`p-3 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border/40 bg-card ${
                    state.selected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/20'
                  }`}
                  onClick={() => toggleSelect(item.sku)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Input
                      type="checkbox"
                      checked={state.selected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-primary text-sm">{item.sku}</span>
                        <Badge variant="default" className="text-xs">
                          {language === 'vi' ? 'Tồn kho:' : 'Stock:'} {item.quantity}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-foreground truncate">{item.variantName}</h4>
                    </div>
                  </div>

                  {state.selected && (
                    <div 
                      className="flex items-center gap-2 shrink-0 ml-7 sm:ml-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-muted-foreground">{language === 'vi' ? 'Số lượng:' : 'Qty:'}</span>
                      <div className="flex items-center gap-1 bg-card border border-border/40 shadow-inset rounded-lg p-0.5">
                        <Button variant="outline"
                          type="button"
                          onClick={() => updateQuantity(item.sku, state.qty - 1, item.quantity)}
                          className="w-7 h-7 rounded hover:bg-muted/20 flex items-center justify-center font-bold"
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          max={item.quantity}
                          value={state.qty}
                          onChange={(e) => updateQuantity(item.sku, Number(e.target.value), item.quantity)}
                          className="w-12 text-center text-sm font-mono font-medium focus:outline-none bg-transparent"
                        />
                        <Button variant="outline"
                          type="button"
                          onClick={() => updateQuantity(item.sku, state.qty + 1, item.quantity)}
                          className="w-7 h-7 rounded hover:bg-muted/20 flex items-center justify-center font-bold"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/40 shrink-0">
          <span className="text-sm font-medium text-muted-foreground">
            {language === 'vi' ? 'Đã chọn: ' : 'Selected: '}
            <strong className="text-primary">{selectedCount} mặt hàng</strong>
          </span>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button onClick={handleConfirm}><PackageCheck className="w-4 h-4 mr-2" />
              {language === 'vi' ? `Xác Nhận (${selectedCount})` : `Confirm (${selectedCount})`}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
