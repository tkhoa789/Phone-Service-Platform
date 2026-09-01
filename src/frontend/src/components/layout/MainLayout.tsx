import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIFloatingButton } from '../ai/AIFloatingButton';
import { Breadcrumb } from '../ui/Breadcrumb';

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-card text-muted-foreground flex font-sans transition-colors duration-300 antialiased selection:bg-emerald-500/30">
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={collapsed} 
        onToggleCollapse={() => setCollapsed(!collapsed)} 
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      {/* Header Top Bar */}
      <Header 
        collapsed={collapsed} 
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Main Content Viewport */}
      <main
        className={`flex-1 transition-[margin-left] duration-200 ease-in-out pt-20 px-4 sm:px-6 lg:px-8 pb-12 overflow-x-hidden ml-0 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
          <Breadcrumb />
          <div className="flex-1 space-y-6">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Floating AI Chat Widget */}
      <AIFloatingButton />
    </div>
  );
};
