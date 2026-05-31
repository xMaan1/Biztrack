'use client';

import { useSidebar } from '../../hooks/useSidebar';
import {
  SidebarHeader,
  SidebarSearch,
  SidebarNav,
  SidebarFooter,
} from './app-sidebar';

export default function Sidebar() {
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    expandedItems,
    toggleExpanded,
    navRef,
    handleNavScroll,
    filteredItems,
    planLoading,
    planInfo,
    isActive,
    getPlanDisplayName,
    purchaseOrdersNavLabel,
    hasPathPermission,
    isSubItemAvailable,
  } = useSidebar();

  return (
    <div className="flex h-full min-h-0 w-full flex-col border-r border-gray-200 bg-white/95 shadow-xl backdrop-blur-md">
      <SidebarHeader planLabel={planInfo ? getPlanDisplayName() : undefined} />
      <SidebarSearch
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={clearSearch}
      />
      <SidebarNav
        navRef={navRef}
        onScroll={handleNavScroll}
        loading={planLoading}
        items={filteredItems}
        searchQuery={searchQuery}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
        isActive={isActive}
        isSubItemAvailable={isSubItemAvailable}
        hasPathPermission={hasPathPermission}
        getSubItemLabel={purchaseOrdersNavLabel}
      />
      <SidebarFooter />
    </div>
  );
}
