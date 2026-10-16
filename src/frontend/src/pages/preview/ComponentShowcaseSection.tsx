import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Drawer } from '../../components/ui/Drawer';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { AppPagination } from '../../components/shared/AppPagination';
import { Tabs } from '../../components/ui/Tabs';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import { SearchInput } from '../../components/shared/SearchInput';
import { 
  Sparkles, Check, AlertTriangle, Info, Bell, Inbox, Trash2, 
  Send, Eye, RefreshCw, Layers, ShieldCheck, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ComponentShowcaseSection: React.FC = () => {
  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form states
  const [inputValue, setInputValue] = useState('');
  const [hasError, setHasError] = useState(false);
  const [selectValue, setSelectValue] = useState('standard');
  const [searchableValue, setSearchableValue] = useState('ip15pm');
  const [textareaValue, setTextareaValue] = useState('');

  // Tabs state
  const [activeTabSample, setActiveTabSample] = useState('overview');
  const [activeTactileTab, setActiveTactileTab] = useState('daily');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = 48;
  const pageSize = 5;

  const searchableOptions = [
    { value: 'ip15pm', label: 'iPhone 15 Pro Max', sublabel: 'Titan Tự Nhiên, 256GB' },
    { value: 'ip15p', label: 'iPhone 15 Pro', sublabel: 'Titan Xanh, 128GB' },
    { value: 'ip14pm', label: 'iPhone 14 Pro Max', sublabel: 'Tím Đậm, 512GB' },
    { value: 's24u', label: 'Samsung Galaxy S24 Ultra', sublabel: 'Titanium Gray, 512GB' },
    { value: 'pixel8', label: 'Google Pixel 8 Pro', sublabel: 'Obsidian, 256GB' },
    { value: 'macm3', label: 'MacBook Pro M3 Max', sublabel: 'Space Black, 36GB' },
  ];

  const sampleTableData = [
    { id: 'TKT-1001', customer: 'Nguyễn Văn An', device: 'iPhone 14 Pro Max', service: 'Thay màn hình OLED', cost: '3.450.000 đ', status: 'success' },
    { id: 'TKT-1002', customer: 'Trần Thị Mai', device: 'Samsung Galaxy S23', service: 'Thay pin chính hãng', cost: '850.000 đ', status: 'info' },
    { id: 'TKT-1003', customer: 'Lê Hoàng Nam', device: 'iPad Air 5', service: 'Sửa lỗi nguồn', cost: '1.200.000 đ', status: 'warning' },
    { id: 'TKT-1004', customer: 'Phạm Minh Quân', device: 'Apple Watch S8', service: 'Ép kính cảm ứng', cost: '950.000 đ', status: 'default' },
    { id: 'TKT-1005', customer: 'Vũ Thảo Trang', device: 'iPhone 13 Pro', service: 'Sửa chân sạc Type-C', cost: '600.000 đ', status: 'danger' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/40 neu-raised flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" /> UIUX-02 Component Standardization
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-semibold text-foreground tracking-tight">
            PSP Premium Neumorphic Component System
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Hệ thống primitive & composite components chuẩn hóa theo tài liệu thiết kế TypeUI Neumorphism và Design Vision v1.0. 
            Mọi điều khiển có chung vật liệu, phản hồi xúc giác cơ học (haptic depression), khả năng truy cập Radix, và tương thích 100% Light / Dark Mode.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            onClick={() => {
              toast.success('Hệ thống thành phần UIUX-02 đã sẵn sàng!', { icon: '✨' });
            }}
            className="shadow-lg shadow-primary/25"
          >
            <Bell className="w-4 h-4" /> Bắn Thử Toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDrawerOpen(true)}
          >
            <Layers className="w-4 h-4" /> Mở Drawer Demo
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: BUTTONS & HAPTIC STATES                            */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">1. Buttons & Interaction States</h2>
            <p className="text-xs text-muted-foreground">8 biến thể chuẩn hóa, phản hồi nhấn cơ học `active:shadow-inset`, không giật layout.</p>
          </div>
          <Badge variant="primary">8 Variants</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="raised" className="p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-primary">variant="primary"</span>
              <p className="text-xs text-muted-foreground">Gradient Mint/Teal với ambient glow shadow</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary" size="sm">Primary SM</Button>
              <Button variant="primary" size="md">Primary MD</Button>
              <Button variant="primary" size="icon"><Check className="w-4 h-4" /></Button>
            </div>
          </Card>

          <Card variant="raised" className="p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-foreground">variant="secondary"</span>
              <p className="text-xs text-muted-foreground">Same-material raised surface</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="secondary" size="sm">Secondary SM</Button>
              <Button variant="secondary" size="md">Secondary MD</Button>
              <Button variant="secondary" size="icon"><Eye className="w-4 h-4" /></Button>
            </div>
          </Card>

          <Card variant="raised" className="p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-foreground">variant="neutral"</span>
              <p className="text-xs text-muted-foreground">Subtle surface tactile button</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="neutral" size="sm">Neutral SM</Button>
              <Button variant="neutral" size="md">Neutral MD</Button>
            </div>
          </Card>

          <Card variant="raised" className="p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-rose-500">variant="danger"</span>
              <p className="text-xs text-muted-foreground">Soft rose raised container</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="danger" size="sm">Danger SM</Button>
              <Button variant="danger" size="md" onClick={() => setConfirmOpen(true)}>Xác Nhận Xóa</Button>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Card variant="raised" className="p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">variant="success" & "warning"</span>
              <p className="text-xs text-muted-foreground">Semantic status action buttons</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="success" size="sm"><ShieldCheck className="w-3.5 h-3.5" /> Thành Công</Button>
              <Button variant="warning" size="sm"><AlertTriangle className="w-3.5 h-3.5" /> Cảnh Báo</Button>
            </div>
          </Card>

          <Card variant="raised" className="p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-muted-foreground">variant="ghost" & "outline"</span>
              <p className="text-xs text-muted-foreground">Subtle borders & flat hover lifts</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="ghost" size="sm">Ghost Button</Button>
              <Button variant="outline" size="sm">Outline Button</Button>
            </div>
          </Card>

          <Card variant="raised" className="p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-semibold text-muted-foreground">Loading & Disabled</span>
              <p className="text-xs text-muted-foreground">Non-interactive feedback states</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary" size="sm" loading>Đang Lưu...</Button>
              <Button variant="secondary" size="sm" disabled>Vô Hiệu Hóa</Button>
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: FORM CONTROLS & RECESSED INPUTS                    */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">2. Form Controls & Recessed Wells</h2>
            <p className="text-xs text-muted-foreground">Khối lõm `shadow-inset`, nhãn thông minh, hỗ trợ ràng buộc ARIA và focus ring semantic.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setHasError(!hasError)}
              className="text-xs"
            >
              Toggle Error: {hasError ? 'ĐANG BẬT' : 'ĐANG TẮT'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card variant="raised" className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Text Input</h3>
            <Input
              label="Họ và tên khách hàng"
              placeholder="Ví dụ: Nguyễn Văn A"
              required
              helperText="Nhập đầy đủ tên có dấu để in phiếu"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              error={hasError ? 'Họ và tên là bắt buộc và tối thiểu 3 ký tự!' : undefined}
            />
            <SearchInput
              placeholder="Tìm kiếm linh kiện hoặc mã máy..."
              className="mt-3"
            />
          </Card>

          <Card variant="raised" className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Select Controls</h3>
            <Select
              label="Phương thức thanh toán"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              required
              helperText="Chọn kênh thanh toán cho đơn hàng"
              error={hasError ? 'Vui lòng chọn phương thức hợp lệ!' : undefined}
            >
              <option value="standard">Tiền mặt tại quầy (COD)</option>
              <option value="transfer">Chuyển khoản VietQR</option>
              <option value="pos_card">Thẻ POS quẹt ngân hàng</option>
              <option value="installment">Trả góp 0% lãi suất</option>
            </Select>

            <SearchableSelect
              label="Lọc thiết bị tiếp nhận"
              options={searchableOptions}
              value={searchableValue}
              onChange={(val) => setSearchableValue(val)}
              placeholder="-- Chọn thiết bị tiếp nhận --"
              required
            />
          </Card>

          <Card variant="raised" className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Textarea & Detailed Notes</h3>
            <Textarea
              label="Mô tả hiện trạng lỗi"
              placeholder="Ví dụ: Máy rơi vỡ màn hình, sọc xanh, sườn cong nhẹ..."
              rows={4}
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              helperText={`${textareaValue.length}/500 ký tự`}
              error={hasError ? 'Mô tả hiện trạng không được để trống!' : undefined}
            />
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: CARDS & DEPTH ARCHITECTURE                         */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">3. Cards & Material Depth Architecture</h2>
            <p className="text-xs text-muted-foreground">Các lớp nổi (`neu-raised`, `neu-raised-md`), khối chìm (`shadow-inset`) và thẻ tương tác.</p>
          </div>
          <Badge variant="default">Material Standards</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="raised" className="p-5 flex flex-col justify-between min-h-[160px]">
            <div>
              <span className="text-xs font-mono text-primary font-semibold">Card variant="raised"</span>
              <h4 className="text-sm font-semibold text-foreground mt-1">Nổi Cấp 1 (Resting)</h4>
              <p className="text-xs text-muted-foreground mt-1">Độ cao tiêu chuẩn cho container, widget và khối hiển thị số liệu.</p>
            </div>
            <Badge variant="default" className="w-fit">Elevation 1</Badge>
          </Card>

          <Card variant="raised-md" className="p-5 flex flex-col justify-between min-h-[160px]">
            <div>
              <span className="text-xs font-mono text-primary font-semibold">Card variant="raised-md"</span>
              <h4 className="text-sm font-semibold text-foreground mt-1">Nổi Cấp 2 (Elevated)</h4>
              <p className="text-xs text-muted-foreground mt-1">Độ cao trung bình cho popover, dropdown floating panel và modal con.</p>
            </div>
            <Badge variant="primary" className="w-fit">Elevation 2</Badge>
          </Card>

          <Card variant="inset" className="p-5 flex flex-col justify-between min-h-[160px]">
            <div>
              <span className="text-xs font-mono text-primary font-semibold">Card variant="inset"</span>
              <h4 className="text-sm font-semibold text-foreground mt-1">Khối Lõm (Recessed Well)</h4>
              <p className="text-xs text-muted-foreground mt-1">Tạo giếng vật liệu chứa biểu đồ, form fields, thanh công cụ và tab container.</p>
            </div>
            <Badge variant="info" className="w-fit">Recessed Inset</Badge>
          </Card>

          <Card variant="interactive" className="p-5 flex flex-col justify-between min-h-[160px]" onClick={() => toast('Đã click Thẻ Tương Tác!')}>
            <div>
              <span className="text-xs font-mono text-primary font-semibold">Card variant="interactive"</span>
              <h4 className="text-sm font-semibold text-foreground mt-1">Thẻ Tương Tác (Hoverable)</h4>
              <p className="text-xs text-muted-foreground mt-1">Rê chuột để nâng nổi (-translate-y-0.5), nhấn để lún cơ học.</p>
            </div>
            <div className="flex items-center justify-between text-xs text-primary font-semibold">
              <span>Bấm Thử Nghiệm</span>
              <Check className="w-4 h-4" />
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 4: BADGES & STATUS CHIPS                              */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">4. Badges & Status Chips</h2>
            <p className="text-xs text-muted-foreground">Các nhãn trạng thái đa chủ đề (Light/Dark) với hiệu ứng pill xúc giác và đèn LED báo hiệu.</p>
          </div>
          <Badge variant="success" dot>Active Theme Parity</Badge>
        </div>

        <Card variant="raised" className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="default" dot>Default Dot</Badge>
            <Badge variant="primary">Primary Mint</Badge>
            <Badge variant="primary" dot>Primary Dot</Badge>
            <Badge variant="success">Hoàn Thành (Success)</Badge>
            <Badge variant="success" dot>Sẵn Sàng</Badge>
            <Badge variant="warning">Đang Chờ (Warning)</Badge>
            <Badge variant="warning" dot>Cần Xử Lý</Badge>
            <Badge variant="danger">Thất Bại (Danger)</Badge>
            <Badge variant="danger" dot>Lỗi Phần Cứng</Badge>
            <Badge variant="info">Thông Tin (Info)</Badge>
            <Badge variant="info" dot>Đang Kiểm Tra</Badge>
            <Badge variant="muted">Lưu Trữ (Muted)</Badge>
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 5: TABS & NAVIGATION                                  */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">5. Tabs & Segmented Troughs</h2>
            <p className="text-xs text-muted-foreground">Máng trượt lõm `shadow-inset` với hai biến thể kích hoạt: Gradient Mint và Tactile Pillow.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="raised" className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Tabs variant="primary" (Gradient Accent)</h3>
            <Tabs
              tabs={[
                { id: 'overview', label: 'Tổng Quan', icon: <Layers className="w-4 h-4" /> },
                { id: 'repairs', label: 'Đơn Sửa Chữa', icon: <ShieldCheck className="w-4 h-4" /> },
                { id: 'customers', label: 'Khách Hàng', icon: <Eye className="w-4 h-4" /> },
              ]}
              activeTab={activeTabSample}
              onChange={(id) => setActiveTabSample(id)}
              fullWidth
              variant="primary"
            />
            <p className="text-xs text-muted-foreground">Tab hiện tại: <strong className="text-primary">{activeTabSample}</strong></p>
          </Card>

          <Card variant="raised" className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Tabs variant="tactile" (Neumorphic Pillow)</h3>
            <Tabs
              tabs={[
                { id: 'daily', label: 'Hôm Nay' },
                { id: 'weekly', label: 'Tuần Này' },
                { id: 'monthly', label: 'Tháng Này' },
                { id: 'yearly', label: 'Năm 2026' },
              ]}
              activeTab={activeTactileTab}
              onChange={(id) => setActiveTactileTab(id)}
              fullWidth
              variant="tactile"
            />
            <p className="text-xs text-muted-foreground">Bộ lọc thời gian: <strong className="text-foreground">{activeTactileTab}</strong></p>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 6: DATA TABLES & CANONICAL PAGINATION                 */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">6. Data Table & Canonical Pagination</h2>
            <p className="text-xs text-muted-foreground">Table container nổi `neu-raised`, header viền mảnh, hover tinh tế và phân trang AppPagination.</p>
          </div>
          <Badge variant="primary">AppPagination</Badge>
        </div>

        <Card variant="raised" className="p-6 space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Phiếu</TableHead>
                <TableHead>Khách Hàng</TableHead>
                <TableHead>Thiết Bị</TableHead>
                <TableHead>Dịch Vụ Kỹ Thuật</TableHead>
                <TableHead>Chi Phí</TableHead>
                <TableHead>Trạng Thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleTableData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono font-semibold text-xs text-primary">{row.id}</TableCell>
                  <TableCell className="font-medium text-xs text-foreground">{row.customer}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.device}</TableCell>
                  <TableCell className="text-xs text-foreground">{row.service}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{row.cost}</TableCell>
                  <TableCell>
                    <Badge variant={row.status as any} dot>
                      {row.status === 'success' ? 'Hoàn tất' : row.status === 'info' ? 'Đang sửa' : row.status === 'warning' ? 'Chờ linh kiện' : row.status === 'danger' ? 'Hủy' : 'Mới tiếp nhận'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <AppPagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </Card>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7: MODALS, DRAWERS & ACCESSIBILITY DIALOGS            */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">7. Modals, Sliding Drawers & Confirmations</h2>
            <p className="text-xs text-muted-foreground">Focus trap, Escape handling, khóa scroll body, restore focus và bề mặt `neu-raised-lg`.</p>
          </div>
          <Badge variant="info">Radix A11y</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="raised" className="p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Accessible Dialog</h3>
              <p className="text-xs text-muted-foreground">Hộp thoại nổi với backdrop blur, nút đóng xúc giác và form bên trong.</p>
            </div>
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              Mở Hộp Thoại Dialog
            </Button>
          </Card>

          <Card variant="raised" className="p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Sliding Drawer</h3>
              <p className="text-xs text-muted-foreground">Ngăn kéo trượt từ cạnh phải màn hình, phục vụ bộ lọc nâng cao hoặc chi tiết phiếu.</p>
            </div>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Mở Ngăn Kéo Drawer
            </Button>
          </Card>

          <Card variant="raised" className="p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Destructive ConfirmDialog</h3>
              <p className="text-xs text-muted-foreground">Hộp thoại xác nhận thao tác nguy hiểm với giếng icon xúc giác.</p>
            </div>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Mở Xác Nhận Xóa
            </Button>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 8: FEEDBACK, EMPTY STATE & SKELETON                   */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-3">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground">8. Feedback Alerts, Empty States & Skeletons</h2>
            <p className="text-xs text-muted-foreground">Thông báo ngữ cảnh lõm nhẹ, màn hình trống với huy hiệu nổi và khung xương chờ tải.</p>
          </div>
          <Badge variant="default">Feedback Elements</Badge>
        </div>

        <div className="space-y-3">
          <Alert variant="info" title="Thông báo hệ thống">
            Máy chủ đã đồng bộ dữ liệu bảo hành và linh kiện lúc 19:00 hôm nay. Mọi bản ghi đều sẵn sàng tra cứu.
          </Alert>
          <Alert variant="success" title="Cập nhật thành công">
            Đã chuyển đổi trạng thái đơn hàng TKT-1001 sang "Sẵn sàng bàn giao cho khách".
          </Alert>
          <Alert variant="warning" title="Cảnh báo tồn kho">
            Số lượng Pin iPhone 15 Pro Max tại Kho Tổng chỉ còn 2 viên, vui lòng tạo đơn đặt hàng bổ sung.
          </Alert>
          <Alert variant="error" title="Lỗi xử lý yêu cầu">
            Không thể hủy giao dịch vì hóa đơn đã được lập và ghi nhận doanh thu vào ca bán hàng.
          </Alert>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <EmptyState
            icon={<Inbox className="w-7 h-7" />}
            title="Chưa có yêu cầu sửa chữa mới"
            description="Hiện tại tất cả các đơn tiếp nhận tại chi nhánh đều đã được phân công cho kỹ thuật viên xử lý."
            action={<Button variant="primary" size="sm">Tiếp Nhận Đơn Mới</Button>}
          />

          <SkeletonCard />
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* ACTIVE MODAL DIALOG INSTANCE                                  */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Tiếp Nhận Thiết Bị Mới"
        description="Nhập thông tin khách hàng và tình trạng thiết bị để tạo phiếu bảo hành/sửa chữa."
      >
        <div className="space-y-4 pt-2">
          <Input label="Tên khách hàng" placeholder="Nguyễn Văn B" required />
          <Input label="Số điện thoại" placeholder="0901 234 567" required />
          <Select label="Hãng máy" required>
            <option>Apple (iPhone, iPad, Mac)</option>
            <option>Samsung Galaxy</option>
            <option>Xiaomi / Redmi</option>
          </Select>
          <Textarea label="Tình trạng máy ban đầu" placeholder="Mô tả trầy xước, mật khẩu máy..." rows={3} />
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button variant="primary" onClick={() => {
              setDialogOpen(false);
              toast.success('Đã lưu phiếu tiếp nhận thành công!');
            }}>
              Lưu Phiếu
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* ACTIVE SLIDING DRAWER INSTANCE                                */}
      {/* ------------------------------------------------------------- */}
      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Bộ Lọc Nâng Cao"
        description="Lọc danh sách theo nhiều tiêu chí kỹ thuật và thời gian"
        size="md"
      >
        <div className="space-y-5">
          <Input label="Từ khóa tìm kiếm" placeholder="Mã phiếu, IMEI, tên..." />
          <Select label="Chi nhánh tiếp nhận">
            <option>Tất cả chi nhánh</option>
            <option>Chi nhánh Quận 1 (Trần Hưng Đạo)</option>
            <option>Chi nhánh Ba Đình (Kim Mã)</option>
          </Select>
          <Select label="Kỹ thuật viên phụ trách">
            <option>Tất cả nhân sự</option>
            <option>Trần Tuấn Anh (Trưởng nhóm phần cứng)</option>
            <option>Lê Đình Nam (Kỹ thuật viên ép kính)</option>
          </Select>
          <div className="p-4 rounded-2xl bg-surface-elevated shadow-inset border border-border/40 space-y-2">
            <span className="text-xs font-semibold text-foreground">Tùy chọn hiển thị</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" id="show_completed" defaultChecked className="rounded" />
              <label htmlFor="show_completed">Bao gồm các đơn đã trả máy</label>
            </div>
          </div>
          <div className="pt-4 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>Đóng</Button>
            <Button variant="primary" className="flex-1" onClick={() => {
              setDrawerOpen(false);
              toast.success('Đã áp dụng bộ lọc mới!');
            }}>
              Áp Dụng
            </Button>
          </div>
        </div>
      </Drawer>

      {/* ------------------------------------------------------------- */}
      {/* ACTIVE CONFIRM DIALOG INSTANCE                                */}
      {/* ------------------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success('Đã xóa dữ liệu thành công!');
        }}
        title="Xóa Bản Ghi Kỹ Thuật"
        description="Bạn có chắc chắn muốn xóa bản ghi tiếp nhận này? Thao tác này sẽ không thể hoàn tác và sẽ được ghi vào Audit Log."
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy Bỏ"
        variant="danger"
      />
    </div>
  );
};
