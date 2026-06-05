'use client';

import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { useSidebarCollapse } from '@/src/hooks/useSidebarCollapse';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, toggle, expand, ready } = useSidebarCollapse();

  const desktopSidebarWidth = collapsed ? 'w-[4.5rem]' : 'w-64';
  const mainMargin = collapsed ? 'md:ml-[4.5rem]' : 'md:ml-64';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex flex-row">
      <div className="hidden md:block">
        <div
          className={cn(
            'fixed left-0 top-0 z-40 flex h-screen flex-col overflow-visible transition-[width] duration-300 ease-in-out',
            ready ? desktopSidebarWidth : 'w-64',
          )}
        >
          <Sidebar
            collapsed={ready && collapsed}
            onToggleCollapse={toggle}
            onExpandSidebar={expand}
          />
        </div>
      </div>
      <div className="md:hidden">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-[60] flex w-64 max-h-[100dvh] flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar collapsed={false} onToggleCollapse={toggle} />
        </div>
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out',
          ready ? mainMargin : 'md:ml-64',
        )}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-4rem)] min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}
