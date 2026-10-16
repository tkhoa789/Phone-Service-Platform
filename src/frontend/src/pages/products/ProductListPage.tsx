import React, { useState, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../stores/themeStore';
import { i18nDictionary } from '../../locales/dictionary';
import { exitSandboxMode } from '../../utils/sandboxUtils';

// Shared & UI Components
import { PageHeader } from '../../components/shared/PageHeader';
import { SearchInput } from '../../components/shared/SearchInput';
import { DataTable } from '../../components/shared/DataTable';
import { AppPagination } from '../../components/shared/AppPagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchableSelect } from '../../components/common/SearchableSelect';

import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Layers,
  Tag,
  Award,
  ChevronDown,
  ChevronUp,
  Printer,
  Sparkles,
  GraduationCap,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useProducts, useCategories, useBrands, useDeleteProduct, useDeleteVariant } from '../../features/products/hooks/useProducts';
import { ProductFormModal } from '../../features/products/components/ProductFormModal';
import { VariantFormModal } from '../../features/products/components/VariantFormModal';
import { BarcodePrintModal } from '../../features/products/components/BarcodePrintModal';
import { useProductsInventoryTour } from '../../features/products/hooks/useProductsInventoryTour';
import { inventorySandboxService } from '../../features/inventory/services/inventorySandboxService';
import { useAuthStore } from '../../stores/authStore';
import { PERMISSIONS } from '../../constants/permissions';
import type { ProductDto, ProductVariantDto } from '../../features/products/types/product.types';

export const ProductListPage: React.FC = () => {
  const { language } = useThemeStore();
  const { can, roles } = useAuthStore();
  const canCreate = can(PERMISSIONS.Product_Create);
  const canEdit = can(PERMISSIONS.Product_Update);
  const canDelete = can(PERMISSIONS.Product_Delete);

  const tProd = i18nDictionary[language].products;
  const tCommon = i18nDictionary[language].common;

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra cờ Sandbox Mode (từ URL hoặc sessionStorage)
  const isSandboxMode =
    searchParams.get('mode') === 'training' ||
    location.search.includes('sandbox=true') ||
    (typeof window !== 'undefined' && sessionStorage.getItem('psp_sandbox_mode') === 'true');

  const [sandboxTick, setSandboxTick] = useState(0);

  const isInventoryRole = (roles || []).includes('Inventory') || searchParams.get('role')?.toLowerCase() === 'inventory';
  const { startTour: startInventoryTour } = useProductsInventoryTour();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('size') || '10', 10);
  const selectedCategory = searchParams.get('categoryId') || '';
  const selectedBrand = searchParams.get('brandId') || '';
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);

  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariantDto | null>(null);
  const [presetProductId, setPresetProductId] = useState<string | undefined>(undefined);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });
  const [deleteVariantConfirm, setDeleteVariantConfirm] = useState<{ isOpen: boolean; id: string; name: string; productId: string }>({ isOpen: false, id: '', name: '', productId: '' });

  const [printModalData, setPrintModalData] = useState<{ productName: string, variantName: string, sku: string, price: number } | null>(null);

  const { data: pagedData, isLoading: loadingProducts } = useProducts({
    page: currentPage,
    pageSize,
    search: searchTerm || undefined,
    categoryId: selectedCategory || undefined,
    brandId: selectedBrand || undefined
  });

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  // Dữ liệu sản phẩm Sandbox khi ở chế độ thực hành
  const sandboxProducts = useMemo(() => {
    if (!isSandboxMode) return [];
    let list = inventorySandboxService.getProducts();
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(lower) || p.code.toLowerCase().includes(lower));
    }
    if (selectedCategory) {
      list = list.filter(p => p.categoryId === selectedCategory);
    }
    if (selectedBrand) {
      list = list.filter(p => p.brandId === selectedBrand);
    }
    return list;
  }, [isSandboxMode, searchTerm, selectedCategory, selectedBrand, sandboxTick]);

  const totalItems = isSandboxMode ? sandboxProducts.length : (pagedData?.totalCount || 0);
  const products = isSandboxMode ? sandboxProducts : (pagedData?.items || []);

  const deleteProductMutation = useDeleteProduct();
  const deleteVariantMutation = useDeleteVariant(deleteVariantConfirm.productId);

  const updateSearchParams = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
      else newParams.delete(key);
    });
    setSearchParams(newParams);
  };

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    updateSearchParams({ search: val, page: '1' });
  };

  // Tự động mở rộng sản phẩm mẫu đầu tiên trong chế độ Sandbox
  React.useEffect(() => {
    if (isSandboxMode && !expandedProductId) {
      setExpandedProductId('prd-demo-01');
    }
  }, [isSandboxMode, expandedProductId]);

  const handleStartTour = () => {
    // 1. Luôn kích hoạt cờ Sandbox đào tạo an toàn
    sessionStorage.setItem('psp_sandbox_mode', 'true');
    if (!isSandboxMode) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('mode', 'training');
      setSearchParams(newParams);
    }

    // 2. Đảm bảo sản phẩm mẫu đầu tiên được mở rộng sẵn sàng cho bước kiểm tra biến thể và in barcode
    setExpandedProductId('prd-demo-01');

    // 3. Khởi động tour sau khi DOM đã bung biến thể
    setTimeout(() => {
      startInventoryTour();
    }, 250);
  };

  const handleResetSandbox = () => {
    inventorySandboxService.reset();
    setSandboxTick(t => t + 1);
    toast.success(language === 'vi' ? 'Đã khôi phục dữ liệu mẫu danh mục sản phẩm!' : 'Sandbox products reset successfully!');
  };

  const handleExitSandbox = () => {
    exitSandboxMode({
      searchParams,
      setSearchParams,
      navigate,
      language,
    });
  };

  const handleConfirmDeleteProduct = async () => {
    try {
      await deleteProductMutation.mutateAsync(deleteProductConfirm.id);
      toast.success(language === 'vi' ? 'Xóa sản phẩm thành công!' : 'Product deleted successfully!');
      setDeleteProductConfirm({ isOpen: false, id: '', name: '' });
      if (products.length === 1 && currentPage > 1) {
        updateSearchParams({ page: (currentPage - 1).toString() });
      }
    } catch {
      toast.error(language === 'vi' ? 'Xóa sản phẩm thất bại!' : 'Failed to delete product!');
    }
  };

  const handleConfirmDeleteVariant = async () => {
    try {
      await deleteVariantMutation.mutateAsync(deleteVariantConfirm.id);
      toast.success(language === 'vi' ? 'Xóa biến thể thành công!' : 'Variant deleted successfully!');
      setDeleteVariantConfirm({ isOpen: false, id: '', name: '', productId: '' });
    } catch {
      toast.error(language === 'vi' ? 'Xóa biến thể thất bại!' : 'Failed to delete variant!');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tProd.productsTitle}
        description={tProd.productsSubtitle}
        icon={<Package className="w-6 h-6 text-emerald-500" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {isInventoryRole && (
              <Button
                id="tour-products-guide-btn"
                type="button"
                onClick={handleStartTour}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 border border-sky-400/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-sky-200 animate-pulse" />
                <span>{language === 'vi' ? 'Hướng dẫn sử dụng (Thủ kho)' : 'User Guide (Inventory)'}</span>
              </Button>
            )}
            {canCreate && (
              <>
                <Button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {tProd.btnAddProduct}
                </Button>
                <Button
                  id="tour-prd-add-variant"
                  variant="outline"
                  onClick={() => { setEditingVariant(null); setPresetProductId(undefined); setShowVariantModal(true); }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {tProd.btnAddVariant}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Amber Sandbox Banner */}
      {isSandboxMode && (
        <div
          id="tour-sandbox-banner"
          className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-500 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-start md:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                <span>Chế độ Thực hành Thủ Kho (Sandbox Training)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-mono font-bold border border-amber-500/30">
                  SAFE MODE
                </span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bạn đang thao tác với danh mục linh kiện mẫu chuẩn (Pin Pisen, Màn hình OLED, Bo sạc Type-C). Dữ liệu sản phẩm thực tế được bảo vệ tuyệt đối.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetSandbox}
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Khôi phục mẫu
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExitSandbox}
              className="border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 text-xs shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Thoát Sandbox
            </Button>
          </div>
        </div>
      )}

      <Card id="tour-prd-catalog" className="p-4">
        <div id="tour-prd-search-filter" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SearchInput
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={tProd.searchPlaceholder}
          />
          <div>
            <SearchableSelect
              options={[{ value: '', label: tProd.allCategories }, ...categories.map((c) => ({ value: c.id, label: c.name, sublabel: `Code: ${c.code}` }))]}
              value={selectedCategory}
              onChange={(val) => updateSearchParams({ categoryId: val, page: '1' })}
              placeholder={tProd.filterCategory}
              searchPlaceholder={tProd.searchCategory}
            />
          </div>
          <div>
            <SearchableSelect
              options={[{ value: '', label: tProd.allBrands }, ...brands.map((b) => ({ value: b.id, label: b.name, sublabel: undefined }))]}
              value={selectedBrand}
              onChange={(val) => updateSearchParams({ brandId: val, page: '1' })}
              placeholder={tProd.filterBrand}
              searchPlaceholder={tProd.searchBrand}
            />
          </div>
        </div>

        <DataTable
          isLoading={loadingProducts && !isSandboxMode}
          isEmpty={products.length === 0}
          emptyTitle={language === 'vi' ? 'Không có sản phẩm' : 'No products'}
          emptyDescription={tProd.emptyProducts}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-muted-foreground">
              <tr>
                <th className="h-10 px-4 font-medium">{tProd.colProductCodeName}</th>
                <th className="h-10 px-4 font-medium">{tProd.colBrand}</th>
                <th className="h-10 px-4 font-medium">{tProd.colCategory}</th>
                <th className="h-10 px-4 font-medium text-center">{tProd.colVariantsCount}</th>
                <th className="h-10 px-4 text-right font-medium">{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product, productIndex) => {
                const isExpanded = expandedProductId === product.id;
                return (
                  <React.Fragment key={product.id}>
                    <tr
                      id={productIndex === 0 ? "tour-prd-first-row" : undefined}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-mono text-xs font-bold text-primary">{product.code}</div>
                        <div className="font-medium text-foreground">{product.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Award className="w-4 h-4" />
                          {product.brandName || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Tag className="w-4 h-4" />
                          {product.categoryName || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-primary">
                        {product.variants?.length || 0} SKU
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {canCreate && (
                          <Button variant="outline" size="sm" onClick={() => { setEditingVariant(null); setPresetProductId(product.id); setShowVariantModal(true); }} title={language === 'vi' ? 'Thêm biến thể' : 'Add variant'}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> +SKU
                          </Button>
                        )}
                        <Button
                          id={productIndex === 0 ? "tour-prd-expand-btn" : undefined}
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                        >
                          <Layers className="w-3.5 h-3.5 mr-1" />
                          {isExpanded ? tProd.btnHideVariants : tProd.btnViewVariants}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setShowProductModal(true); }} title={tCommon.edit}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteProductConfirm({ isOpen: true, id: product.id, name: product.name })} title={tCommon.delete}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-muted/20 border-b">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" /> {tProd.variantsListTitle} <span className="text-primary font-bold">{product.name}</span>
                              </h4>
                            </div>
                            {product.variants && product.variants.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {product.variants.map((v, vIndex) => (
                                  <Card key={v.id} className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="font-medium text-sm block">{v.variantName || (v as any).name}</span>
                                        <span className="font-mono text-xs text-primary font-bold">{v.sku}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        {canEdit && (
                                          <Button variant="danger" size="icon" className="h-6 w-6" onClick={() => { setEditingVariant(v); setPresetProductId(product.id); setShowVariantModal(true); }}>
                                            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                                          </Button>
                                        )}
                                        {canDelete && (
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteVariantConfirm({ isOpen: true, id: v.id, name: v.sku, productId: product.id })}>
                                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-3 border-t">
                                      <span className="text-muted-foreground">{tProd.listedPrice}</span>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          id={productIndex === 0 && vIndex === 0 ? "tour-prd-barcode-btn" : undefined}
                                          variant="outline"
                                          size="sm"
                                          className="h-6 text-[10px]"
                                          onClick={() => setPrintModalData({ productName: product.name, variantName: v.variantName || (v as any).name, sku: v.sku, price: v.salePrice || (v as any).price || 0 })}
                                        >
                                          <Printer className="w-3 h-3 mr-1" /> Barcode
                                        </Button>
                                        <span className="font-bold text-primary">{(v.salePrice || (v as any).price || 0).toLocaleString('vi-VN')} ₫</span>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground text-sm italic">{tProd.emptyVariants}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </DataTable>

        <div className="mt-4">
          <AppPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => updateSearchParams({ page: p.toString() })}
          />
        </div>
      </Card>

      {showProductModal && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {showVariantModal && (
        <VariantFormModal
          variant={editingVariant}
          presetProductId={presetProductId}
          products={products}
          onClose={() => setShowVariantModal(false)}
        />
      )}

      {printModalData && (
        <BarcodePrintModal
          productName={printModalData.productName}
          variantName={printModalData.variantName}
          sku={printModalData.sku}
          price={printModalData.price}
          onClose={() => setPrintModalData(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteProductConfirm.isOpen}
        onClose={() => setDeleteProductConfirm({ isOpen: false, id: '', name: '' })}
        onConfirm={handleConfirmDeleteProduct}
        title={language === 'vi' ? 'Xác nhận xóa sản phẩm' : 'Confirm Delete'}
        description={`${language === 'vi' ? 'Bạn có chắc chắn muốn xóa sản phẩm' : 'Are you sure you want to delete product'} "${deleteProductConfirm.name}"? ${language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}`}
        variant="danger"
        isLoading={deleteProductMutation.isPending}
      />

      <ConfirmDialog
        isOpen={deleteVariantConfirm.isOpen}
        onClose={() => setDeleteVariantConfirm({ isOpen: false, id: '', name: '', productId: '' })}
        onConfirm={handleConfirmDeleteVariant}
        title={language === 'vi' ? 'Xác nhận xóa biến thể' : 'Confirm Delete'}
        description={`${language === 'vi' ? 'Bạn có chắc chắn muốn xóa biến thể' : 'Are you sure you want to delete variant'} "${deleteVariantConfirm.name}"? ${language === 'vi' ? 'Hành động này không thể hoàn tác.' : 'This action cannot be undone.'}`}
        variant="danger"
        isLoading={deleteVariantMutation.isPending}
      />
    </div>
  );
};
