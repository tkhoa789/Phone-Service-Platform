import React, { useState } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { ComponentShowcaseSection } from './ComponentShowcaseSection';
import { ApplicationShellShowcaseSection } from './ApplicationShellShowcaseSection';
import { 
  Sun, Moon, Check, Search, Sparkles, Shield, ArrowRight, ArrowUpRight,
  Download, Plus, Layers, Type, Palette, Eye, AlertTriangle, XCircle, Info,
  Sliders, Smartphone, Compass, Fingerprint, Box, Zap, LayoutDashboard,
  BarChart3, Users, Inbox, Settings, ChevronDown, ChevronRight, Calendar,
  TrendingUp, Filter, Bell
} from 'lucide-react';

interface OrderItem {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'Complete' | 'Active' | 'Pending' | 'Cancelled';
}

const INITIAL_ORDERS: OrderItem[] = [
  { id: 'ORD-4821', customer: 'Elena Morales', date: 'Jun 21, 2026', total: 248, status: 'Complete' },
  { id: 'ORD-4820', customer: 'James Okonkwo', date: 'Jun 20, 2026', total: 59, status: 'Active' },
  { id: 'ORD-4819', customer: 'Priya Shah', date: 'Jun 20, 2026', total: 512, status: 'Pending' },
  { id: 'ORD-4818', customer: 'Kael Chen', date: 'Jun 19, 2026', total: 134, status: 'Cancelled' },
  { id: 'ORD-4817', customer: 'Sera Nguyen', date: 'Jun 18, 2026', total: 320, status: 'Complete' },
  { id: 'ORD-4816', customer: 'Dorn Walsh', date: 'Jun 18, 2026', total: 42, status: 'Active' },
];

export function DesignSystemPreviewPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'shell' | 'components' | 'application' | 'foundation'>('shell');

  // Application Tab State
  const [activeRail, setActiveRail] = useState<'dashboard' | 'analytics' | 'customers' | 'inbox' | 'settings'>('dashboard');
  const [activeSubnav, setActiveSubnav] = useState<'dashboard' | 'reports' | 'automations'>('dashboard');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [selectedDevices, setSelectedDevices] = useState<{ [key: string]: boolean }>({
    desktop: true,
    tablet: true,
    mobile: true
  });
  const [tablePage, setTablePage] = useState(1);
  const [pressDemoActive, setPressDemoActive] = useState(false);

  // Filtered orders
  const filteredOrders = INITIAL_ORDERS.filter(ord => {
    const matchesSearch = ord.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          ord.customer.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'All' || ord.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleDevice = (dev: string) => {
    setSelectedDevices(prev => ({ ...prev, [dev]: !prev[dev] }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* ------------------------------------------------------------- */}
      {/* TOP WORKSTREAM CONTROLLER BAR                                  */}
      {/* ------------------------------------------------------------- */}
      <nav className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                TYPEUI NEUMORPHISM
              </span>
              <span className="text-xs text-muted-foreground font-mono hidden md:inline">
                typeui.sh/design-skills/neumorphism
              </span>
            </div>
            
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl neu-inset overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab('shell')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'shell'
                    ? 'shadow-inset text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                UIUX-03 App Shell
              </button>
              <button
                onClick={() => setActiveTab('components')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'components'
                    ? 'shadow-inset text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                UIUX-02 Components
              </button>
              <button
                onClick={() => setActiveTab('application')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'application'
                    ? 'shadow-inset text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Application Tab (Pulse Desk)
              </button>
              <button
                onClick={() => setActiveTab('foundation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'foundation'
                    ? 'shadow-inset text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Design System Tokens
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset transition-all font-semibold text-xs cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chế độ Tối (Dark)</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chế độ Sáng (Light)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* MODE 1: FULL TYPEUI APPLICATION TAB (PULSE DESK)               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'application' && (
        <div className="flex min-h-[calc(100vh-57px)] bg-background">
          {/* 1. DUAL-TIER SIDEBAR */}
          <aside className="hidden lg:flex shrink-0 border-r border-border">
            {/* Primary Category Icon Rail */}
            <div className="w-16 flex flex-col items-center py-6 border-r border-border gap-6">
              <button 
                className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-primary cursor-pointer hover:neu-raised-md active:shadow-inset transition-all"
                title="Pulse Desk Home"
              >
                <Zap className="w-5 h-5 fill-primary/20" />
              </button>

              <ul className="flex flex-col items-center gap-3">
                <li>
                  <button 
                    onClick={() => setActiveRail('dashboard')}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      activeRail === 'dashboard' 
                        ? 'shadow-inset text-primary font-bold' 
                        : 'text-muted-foreground hover:neu-raised hover:text-foreground active:shadow-inset'
                    }`}
                    title="Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveRail('analytics')}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      activeRail === 'analytics' 
                        ? 'shadow-inset text-primary font-bold' 
                        : 'text-muted-foreground hover:neu-raised hover:text-foreground active:shadow-inset'
                    }`}
                    title="Analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveRail('customers')}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      activeRail === 'customers' 
                        ? 'shadow-inset text-primary font-bold' 
                        : 'text-muted-foreground hover:neu-raised hover:text-foreground active:shadow-inset'
                    }`}
                    title="Customers"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveRail('inbox')}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      activeRail === 'inbox' 
                        ? 'shadow-inset text-primary font-bold' 
                        : 'text-muted-foreground hover:neu-raised hover:text-foreground active:shadow-inset'
                    }`}
                    title="Inbox"
                  >
                    <Inbox className="w-4 h-4" />
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveRail('settings')}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      activeRail === 'settings' 
                        ? 'shadow-inset text-primary font-bold' 
                        : 'text-muted-foreground hover:neu-raised hover:text-foreground active:shadow-inset'
                    }`}
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Secondary Navigation Pane */}
            <div className="w-56 flex flex-col justify-between p-4 bg-background">
              <div className="space-y-4">
                {/* Header title with quick add */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-foreground">Pulse Desk</span>
                  <button className="w-6 h-6 rounded-lg neu-raised flex items-center justify-center text-muted-foreground hover:text-primary active:shadow-inset cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Inset Search Views Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search views..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg neu-inset text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveSubnav('dashboard')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      activeSubnav === 'dashboard'
                        ? 'shadow-inset text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveSubnav('reports')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                      activeSubnav === 'reports'
                        ? 'shadow-inset text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>Reports</span>
                  </button>
                  <button
                    onClick={() => setActiveSubnav('automations')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                      activeSubnav === 'automations'
                        ? 'shadow-inset text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>Automations</span>
                  </button>
                </nav>
              </div>

              {/* User Profile Chip */}
              <div className="p-2.5 rounded-xl neu-raised flex items-center justify-between gap-2.5">
                <div className="w-8 h-8 rounded-full neu-inset flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  ML
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">Morgan Lee</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">morgan@softui.io</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>
            </div>
          </aside>

          {/* MAIN DASHBOARD CONTENT CANVAS */}
          <main className="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
            {/* 2. TOP OPERATIONS HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Operations overview</h1>
                <p className="text-xs text-muted-foreground font-medium">Q2 · week 26</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Global Inset Search */}
                <div className="relative w-64 md:w-80">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search customers, orders, reports..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl neu-inset text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>

                {/* Quick Action Buttons */}
                <button 
                  className="w-9 h-9 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                </button>
                <button 
                  className="w-9 h-9 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Primary New Report CTA */}
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset text-primary font-bold text-xs transition-all cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>New report</span>
                </button>
              </div>
            </div>

            {/* 3. HERO KPI CARD: LEADS GENERATED PER WEEK */}
            <div className="p-6 rounded-2xl neu-raised-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full neu-inset flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tight">3.8k</div>
                    <p className="text-xs text-muted-foreground">Leads generated per week</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 neu-inset flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +24%
                  </span>
                  <div className="text-xs text-muted-foreground space-x-3 hidden sm:block font-mono">
                    <span>Money spent: <strong className="text-foreground">$3,423</strong></span>
                    <span>•</span>
                    <span>Conversion rate: <strong className="text-foreground">0.3%</strong></span>
                  </div>
                </div>
              </div>

              {/* 7-Day Neumorphic Dual-Tone Bar Chart */}
              <div className="pt-2">
                <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
                  {[
                    { day: 'Mon', h1: '65%', h2: '40%' },
                    { day: 'Tue', h1: '80%', h2: '55%' },
                    { day: 'Wed', h1: '75%', h2: '50%' },
                    { day: 'Thu', h1: '90%', h2: '60%' },
                    { day: 'Fri', h1: '82%', h2: '52%' },
                    { day: 'Sat', h1: '95%', h2: '65%' },
                    { day: 'Sun', h1: '88%', h2: '58%' },
                  ].map((col, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        {/* Primary Bar */}
                        <div 
                          style={{ height: col.h1 }} 
                          className="w-3.5 sm:w-5 bg-emerald-600 dark:bg-emerald-500 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110"
                        />
                        {/* Secondary Bar */}
                        <div 
                          style={{ height: col.h2 }} 
                          className="w-3.5 sm:w-5 bg-emerald-300 dark:bg-emerald-800/80 rounded-t-md shadow-sm transition-all duration-300 hover:brightness-110"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">{col.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-raised text-xs font-semibold cursor-pointer">
                  <span>Last 7 days</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                  <span>Users report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. MIDDLE METRICS ROW: 3 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 2: Visits by OS */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">345k</div>
                      <p className="text-xs text-muted-foreground">Visits by OS</p>
                    </div>
                    <div className="text-[11px] space-y-1 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>macOS</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-300" />
                        <span>Windows</span>
                      </div>
                    </div>
                  </div>

                  {/* Circular Donut Gauge Arc */}
                  <div className="py-6 flex items-center justify-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        {/* Track */}
                        <path
                          className="stroke-muted/30"
                          strokeWidth="3.8"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Progress */}
                        <path
                          className="stroke-emerald-600 dark:stroke-emerald-500 transition-all duration-1000"
                          strokeDasharray="74, 100"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold">74%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg neu-raised text-xs font-semibold cursor-pointer">
                    <span>Last 7 days</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                    <span>Users report</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Card 3: Users this week */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold flex items-center gap-2">
                        91.2k
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          ↗ 10%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Users this week</p>
                    </div>
                  </div>

                  {/* Multi-Segment Stacked Bar Chart */}
                  <div className="h-36 pt-4 flex items-end justify-between gap-1.5 px-1">
                    {[
                      { direct: '30%', ref: '20%', soc: '15%' },
                      { direct: '45%', ref: '25%', soc: '20%' },
                      { direct: '55%', ref: '30%', soc: '25%' },
                      { direct: '40%', ref: '22%', soc: '18%' },
                      { direct: '60%', ref: '35%', soc: '28%' },
                      { direct: '25%', ref: '15%', soc: '10%' },
                      { direct: '35%', ref: '20%', soc: '12%' },
                    ].map((st, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end items-center gap-0.5 h-full">
                        <div style={{ height: st.soc }} className="w-full bg-emerald-200 dark:bg-emerald-900 rounded-t-sm" />
                        <div style={{ height: st.ref }} className="w-full bg-emerald-400 dark:bg-emerald-700" />
                        <div style={{ height: st.direct }} className="w-full bg-emerald-600 dark:bg-emerald-500 rounded-b-sm" />
                        <span className="text-[10px] text-muted-foreground font-mono mt-1">
                          {['M','T','W','T','F','S','S'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-muted-foreground pt-2 border-t border-border">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Direct</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Referral</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-200" /> Social</span>
                </div>
              </div>

              {/* Card 4: Website traffic */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <span>Website traffic</span>
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <button className="w-6 h-6 rounded-lg neu-raised flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                      <Download className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Segmented Device Filters with Inset Active States */}
                  <div className="flex items-center gap-2 pt-2 text-xs font-medium">
                    {['desktop', 'tablet', 'mobile'].map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDevice(d)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer capitalize ${
                          selectedDevices[d]
                            ? 'shadow-inset text-primary font-bold'
                            : 'neu-raised text-muted-foreground'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-sm ${selectedDevices[d] ? 'bg-primary' : 'border border-muted-foreground'}`} />
                        <span>{d}</span>
                      </button>
                    ))}
                  </div>

                  {/* Circular Donut Metric Gauge */}
                  <div className="py-4 flex items-center justify-center">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="stroke-muted/30"
                          strokeWidth="3.5"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="stroke-emerald-600 dark:stroke-emerald-400"
                          strokeDasharray="28, 100"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-lg font-bold">28%</span>
                        <span className="text-[9px] text-muted-foreground font-medium">Unique visitors</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel Breakdown Breakdown */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-muted-foreground">
                    <div>Direct: <strong className="text-foreground">$13.5k</strong></div>
                    <div>Sponsor: <strong className="text-foreground">$13.5k</strong></div>
                    <div>E-mail: <strong className="text-foreground">$13.5k</strong></div>
                    <div>Affiliate: <strong className="text-foreground">$13.5k</strong></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg neu-raised text-xs font-semibold cursor-pointer">
                    <span>Last 7 days</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                    <span>Website report</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5. PERFORMANCE & REVENUE ROW: 2 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 5: Performance / Clicks & CPC */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-xs text-muted-foreground">Clicks</span>
                      <div className="text-2xl font-bold">234.5K</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">CPC</span>
                      <div className="text-2xl font-bold">$1.20</div>
                    </div>
                  </div>

                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-raised text-xs font-semibold cursor-pointer">
                    <span>Last week</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* SVG Trend Line Curve */}
                <div className="h-40 pt-2 relative">
                  <svg className="w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="none">
                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="35" x2="400" y2="35" stroke="currentColor" className="text-muted/20" strokeDasharray="3 3" />
                    <line x1="0" y1="70" x2="400" y2="70" stroke="currentColor" className="text-muted/20" strokeDasharray="3 3" />
                    <line x1="0" y1="105" x2="400" y2="105" stroke="currentColor" className="text-muted/20" strokeDasharray="3 3" />
                    
                    {/* Secondary Trend Curve */}
                    <path
                      d="M 0 100 Q 100 80 200 60 T 400 30"
                      fill="none"
                      stroke="#a7f3d0"
                      strokeWidth="2.5"
                      className="dark:stroke-emerald-800"
                    />
                    {/* Primary Curve */}
                    <path
                      d="M 0 130 C 100 110, 150 40, 250 30 C 320 20, 360 25, 400 20"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="3.5"
                      className="dark:stroke-emerald-400"
                    />
                  </svg>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-2">
                    <span>Jan 22</span>
                    <span>Jan 23</span>
                    <span>Jan 24</span>
                    <span>Jan 25</span>
                    <span>Jan 26</span>
                    <span>Jan 27</span>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>View report</span>
                </button>
              </div>

              {/* Card 6: Sales this month */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">$987,756</div>
                    <p className="text-xs text-muted-foreground">Sales this month</p>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl neu-inset font-mono text-xs text-muted-foreground">
                    Apr 17–May 17, 2025
                  </div>
                </div>

                {/* 7-Day Grouped Bar Chart */}
                <div className="h-40 pt-2 flex items-end justify-between gap-2 px-1">
                  {[
                    { b1: 50, b2: 40 },
                    { b1: 75, b2: 60 },
                    { b1: 65, b2: 55 },
                    { b1: 90, b2: 70 },
                    { b1: 80, b2: 65 },
                    { b1: 95, b2: 80 },
                    { b1: 85, b2: 75 },
                  ].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div style={{ height: `${val.b1}%` }} className="w-2.5 sm:w-3.5 bg-emerald-600 rounded-t-sm" />
                        <div style={{ height: `${val.b2}%` }} className="w-2.5 sm:w-3.5 bg-emerald-300 dark:bg-emerald-800 rounded-t-sm" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg neu-raised text-xs font-semibold cursor-pointer">
                    <span>Last 7 days</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                    <span>Users report</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 6. ANALYTICAL MODULES: TASK STATUS MIX & INCOME VS EXPENSE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Task status mix */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">Task status mix</h3>
                    <p className="text-xs text-muted-foreground">Current board snapshot</p>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-600" /> Queued</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Active</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Complete</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Failed</span>
                </div>

                {/* Pie / Donut Chart Representation */}
                <div className="py-4 flex items-center justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Complete slice (65%) */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#059669" strokeWidth="20" strokeDasharray="155 240" strokeDashoffset="0" />
                      {/* Active slice (20%) */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="48 240" strokeDashoffset="-155" />
                      {/* Failed slice (8%) */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="20" strokeDasharray="20 240" strokeDashoffset="-203" />
                      {/* Queued slice (7%) */}
                      <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0d9488" strokeWidth="20" strokeDasharray="17 240" strokeDashoffset="-223" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Income vs expense */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base">Income vs expense</h3>
                    <p className="text-xs text-muted-foreground">Rolling six months · $k</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Income</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> Expense</span>
                  </div>
                </div>

                {/* Dual Bar Chart (6 Months) */}
                <div className="h-48 pt-4 flex items-end justify-between gap-3 px-2">
                  {[
                    { m: 'Jan', inc: '60%', exp: '40%' },
                    { m: 'Feb', inc: '70%', exp: '45%' },
                    { m: 'Mar', inc: '75%', exp: '50%' },
                    { m: 'Apr', inc: '68%', exp: '42%' },
                    { m: 'May', inc: '85%', exp: '52%' },
                    { m: 'Jun', inc: '90%', exp: '56%' },
                  ].map((mo, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1.5 h-full">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        <div style={{ height: mo.inc }} className="w-3.5 bg-emerald-600 rounded-t-sm shadow-sm" />
                        <div style={{ height: mo.exp }} className="w-3.5 bg-sky-500 rounded-t-sm shadow-sm" />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">{mo.m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 7. RECENT ORDERS DATA TABLE */}
            <div className="p-6 rounded-2xl neu-raised-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base">Recent orders</h3>
                  <p className="text-xs text-muted-foreground">
                    Sortable by order ID, customer name, date, total, and transaction status.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl neu-inset text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-40 sm:w-48"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl neu-raised text-xs font-medium text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="All">All statuses</option>
                    <option value="Complete">Complete</option>
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  {/* Export Button */}
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-raised hover:neu-raised-md active:shadow-inset text-xs font-semibold cursor-pointer transition-all">
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-xl neu-inset p-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[11px] font-mono text-muted-foreground uppercase">
                      <th className="p-3">Order</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-foreground block">{ord.id}</span>
                          <span className="text-[11px] text-muted-foreground">{ord.customer}</span>
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">{ord.date}</td>
                        <td className="p-3 font-bold font-mono text-foreground">${ord.total}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold neu-inset ${
                            ord.status === 'Complete' ? 'text-emerald-600 dark:text-emerald-400' :
                            ord.status === 'Active' ? 'text-amber-600 dark:text-amber-400' :
                            ord.status === 'Pending' ? 'text-sky-600 dark:text-sky-400' :
                            'text-rose-600 dark:text-rose-400'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button className="px-3 py-1 rounded-lg neu-raised hover:neu-raised-md active:shadow-inset font-semibold text-xs text-foreground cursor-pointer transition-all">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
                <span>Showing 1–{filteredOrders.length} of 10 orders</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setTablePage(p => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                    className="w-7 h-7 rounded-lg neu-raised flex items-center justify-center text-muted-foreground hover:text-foreground active:shadow-inset disabled:opacity-40 cursor-pointer"
                  >
                    &lt;
                  </button>
                  <button 
                    onClick={() => setTablePage(1)}
                    className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center cursor-pointer ${
                      tablePage === 1 ? 'shadow-inset text-primary' : 'neu-raised text-muted-foreground'
                    }`}
                  >
                    1
                  </button>
                  <button 
                    onClick={() => setTablePage(2)}
                    className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center cursor-pointer ${
                      tablePage === 2 ? 'shadow-inset text-primary' : 'neu-raised text-muted-foreground'
                    }`}
                  >
                    2
                  </button>
                  <button 
                    onClick={() => setTablePage(p => Math.min(2, p + 1))}
                    disabled={tablePage === 2}
                    className="w-7 h-7 rounded-lg neu-raised flex items-center justify-center text-muted-foreground hover:text-foreground active:shadow-inset disabled:opacity-40 cursor-pointer"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODE 2: DESIGN SYSTEM TOKENS & FOUNDATION SHOWCASE             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'foundation' && (
        <div className="p-4 md:p-8 space-y-10 max-w-7xl mx-auto">
          {/* 1. TYPEUI NEUMORPHIC CORE CONFORMANCE SHOWCASE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Compass className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">1. TypeUI Neumorphism Core Principles</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Visual verification of TypeUI foundational rules: Same-material extrusion, 135° directional lighting, dual light/dark shadows, convex/concave curvature, and physical press-in response.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1.1 Same Material Principle */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Principle 01
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {theme === 'light' ? '#E2E8F0' : '#0B1120'}
                    </span>
                  </div>
                  <h3 className="font-bold text-base">Same-Material Extrusion</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Elements appear extruded directly out of the canvas. The raised card shares the <strong>exact same background color</strong> as the canvas. 100% of depth is formed by light highlights and shadow math.
                  </p>

                  <div className="p-4 rounded-xl neu-inset space-y-3">
                    <div className="text-[11px] font-mono text-muted-foreground text-center">
                      Canvas Background: <span className="font-bold text-foreground">{theme === 'light' ? 'Slate 200 (#E2E8F0)' : 'Cyber Navy (#0B1120)'}</span>
                    </div>
                    <div className="p-4 rounded-xl neu-raised text-center font-semibold text-xs text-foreground flex items-center justify-center gap-2">
                      <Box className="w-4 h-4 text-primary" />
                      <span>Extruded Element (Zero contrast fill)</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-muted-foreground pt-2 border-t border-border flex justify-between">
                  <span>Light Rim: rgba(255,255,255,{theme === 'light' ? '0.65' : '0.06'})</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">TypeUI Conforming</span>
                </div>
              </div>

              {/* 1.2 Convex vs Concave Curvature */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Principle 02
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      145° Gradients
                    </span>
                  </div>
                  <h3 className="font-bold text-base">Convex vs Concave Surfaces</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    TypeUI curvature gradients simulate spherical light reflection: convex pushes out toward the light; concave curves inward creating a recessed dish.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl neu-convex text-center space-y-1">
                      <span className="text-xs font-bold text-foreground block">Convex</span>
                      <span className="text-[10px] text-muted-foreground font-mono block">Raised Arch</span>
                    </div>
                    <div className="p-3.5 rounded-xl neu-concave text-center space-y-1">
                      <span className="text-xs font-bold text-foreground block">Concave</span>
                      <span className="text-[10px] text-muted-foreground font-mono block">Recessed Dish</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-muted-foreground pt-2 border-t border-border flex justify-between">
                  <span>--neu-convex / --neu-concave</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">TypeUI Micro-Depth</span>
                </div>
              </div>

              {/* 1.3 Tactile Press-In Interaction */}
              <div className="p-6 rounded-2xl neu-raised-md space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      Principle 03
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Active Inset
                    </span>
                  </div>
                  <h3 className="font-bold text-base">Physical Tactile Press</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Controls invert from convex raised shadows to concave inset shadows on click, creating the physical sensation of pushing into mechanical material.
                  </p>

                  <div className="pt-1 flex flex-col items-center gap-2">
                    <button
                      onMouseDown={() => setPressDemoActive(true)}
                      onMouseUp={() => setPressDemoActive(false)}
                      onMouseLeave={() => setPressDemoActive(false)}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm cursor-pointer transition-all select-none flex items-center justify-center gap-2 ${
                        pressDemoActive 
                          ? 'neu-pressed text-primary scale-[0.99]' 
                          : 'neu-interactive text-foreground'
                      }`}
                    >
                      <Fingerprint className={`w-4 h-4 transition-colors ${pressDemoActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{pressDemoActive ? 'Đang Nhấn Chìm (Inset)' : 'Nhấn & Giữ Thử Nghiệm'}</span>
                    </button>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      State: <strong className="text-primary">{pressDemoActive ? 'Concave Inset' : 'Convex Raised'}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-muted-foreground pt-2 border-t border-border flex justify-between">
                  <span>.neu-interactive:active</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Mechanical Haptics</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. ELEVATION HIERARCHY SCALE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Layers className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">2. Neumorphic Elevation & Depth Scale</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl neu-raised space-y-2">
                <div className="text-xs font-bold text-primary">neu-raised (shadow-sm)</div>
                <h4 className="font-bold text-sm">3px / 6px Elevation</h4>
                <p className="text-xs text-muted-foreground">Standard tactile buttons, icon toggles, and compact cards.</p>
              </div>
              <div className="p-6 rounded-2xl neu-raised-md space-y-2">
                <div className="text-xs font-bold text-primary">neu-raised-md (shadow-md)</div>
                <h4 className="font-bold text-sm">6px / 12px Elevation</h4>
                <p className="text-xs text-muted-foreground">Dashboard metric cards, chart modules, and tables.</p>
              </div>
              <div className="p-6 rounded-2xl neu-raised-lg space-y-2">
                <div className="text-xs font-bold text-primary">neu-raised-lg (shadow-lg)</div>
                <h4 className="font-bold text-sm">8px / 16px Elevation</h4>
                <p className="text-xs text-muted-foreground">Floating dialogs, popovers, and elevated action panels.</p>
              </div>
              <div className="p-6 rounded-2xl neu-inset space-y-2">
                <div className="text-xs font-bold text-primary">neu-inset (shadow-inset)</div>
                <h4 className="font-bold text-sm">Inset Recessed Dish</h4>
                <p className="text-xs text-muted-foreground">Form inputs, active navigation links, and pressed buttons.</p>
              </div>
            </div>
          </section>

          {/* 3. TYPOGRAPHY SCALE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Type className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">3. Typography Hierarchy (Plus Jakarta Sans)</h2>
            </div>
            <div className="p-6 rounded-2xl neu-raised-md space-y-4">
              <h1 className="text-2xl font-bold">H1 Display — Quản Lý Dịch Vụ Sửa Chữa (700 Bold)</h1>
              <h2 className="text-xl font-bold">H2 Section — Phiếu Tiếp Nhận Kỹ Thuật #TK-2026-889 (700 Bold)</h2>
              <h3 className="text-base font-semibold">H3 Subheading — Chi tiết linh kiện thay thế (600 Semibold)</h3>
              <p className="text-sm text-foreground">Body Regular — Đã kiểm tra chức năng FaceID và cảm ứng hoạt động bình thường. (400 Normal)</p>
              <p className="text-xs text-muted-foreground font-mono">Helper Muted — REF-99482 • Kỹ thuật viên: Nguyễn Văn A (WCAG AA ≥ 5.5:1 Pass)</p>
            </div>
          </section>

          {/* 4. SEMANTIC COLOR TOKENS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Palette className="w-5 h-5" />
              <h2 className="text-xl font-bold tracking-tight">4. Semantic Colors & Status Badges</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl neu-raised space-y-1">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <div className="font-bold text-xs">Primary Cyber Mint</div>
                <div className="text-[10px] text-muted-foreground font-mono">#059669 / #10B981</div>
              </div>
              <div className="p-4 rounded-xl neu-raised space-y-1">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <div className="font-bold text-xs">Warning / Active</div>
                <div className="text-[10px] text-muted-foreground font-mono">#F59E0B</div>
              </div>
              <div className="p-4 rounded-xl neu-raised space-y-1">
                <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                <div className="font-bold text-xs">Info / Pending</div>
                <div className="text-[10px] text-muted-foreground font-mono">#0284C7 / #38BDF8</div>
              </div>
              <div className="p-4 rounded-xl neu-raised space-y-1">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <div className="font-bold text-xs">Danger / Cancelled</div>
                <div className="text-[10px] text-muted-foreground font-mono">#EF4444</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 0: UIUX-03 APPLICATION SHELL SHOWCASE                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'shell' && <ApplicationShellShowcaseSection />}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: UIUX-02 COMPONENT SHOWCASE                             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'components' && <ComponentShowcaseSection />}

      {/* ------------------------------------------------------------- */}
      {/* FOOTER METADATA                                               */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-border py-6 px-4 md:px-8 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          PSP Enterprise Foundation • TypeUI Neumorphism Conformance & Application Tab Implementation
        </div>
        <div className="font-mono">
          Theme: <strong className="text-primary uppercase">{theme}</strong> • Font: Plus Jakarta Sans • Spec: TypeUI Neumorphism
        </div>
      </footer>
    </div>
  );
}
