import type { Ref } from 'react';
import type { MenuItem, SubMenuItem } from '@/src/types/sidebar';
import { SidebarMenuItem } from './SidebarMenuItem';
import { SidebarNavSkeleton } from './SidebarNavSkeleton';
import { SidebarEmptySearch } from './SidebarEmptySearch';

interface SidebarNavProps {
  navRef: Ref<HTMLElement>;
  onScroll: () => void;
  loading: boolean;
  items: MenuItem[];
  searchQuery: string;
  expandedItems: Set<string>;
  onToggleExpanded: (itemText: string) => void;
  isActive: (path: string, exact?: boolean) => boolean;
  isSubItemAvailable: (subItem: SubMenuItem) => boolean;
  hasPathPermission: (path?: string) => boolean;
  getSubItemLabel: (subItem: SubMenuItem) => string;
}

export function SidebarNav({
  navRef,
  onScroll,
  loading,
  items,
  searchQuery,
  expandedItems,
  onToggleExpanded,
  isActive,
  isSubItemAvailable,
  hasPathPermission,
  getSubItemLabel,
}: SidebarNavProps) {
  return (
    <nav
      ref={navRef}
      className="p-4 space-y-3 flex-1 overflow-y-auto"
      onScroll={onScroll}
    >
      {loading ? (
        <SidebarNavSkeleton />
      ) : (
        items.map((item) => (
          <SidebarMenuItem
            key={item.text}
            item={item}
            isExpanded={expandedItems.has(item.text)}
            onToggle={() => onToggleExpanded(item.text)}
            isActive={isActive}
            isSubItemAvailable={isSubItemAvailable}
            hasPathPermission={hasPathPermission}
            getSubItemLabel={getSubItemLabel}
          />
        ))
      )}

      {!loading && items.length === 0 && searchQuery && <SidebarEmptySearch />}
    </nav>
  );
}
