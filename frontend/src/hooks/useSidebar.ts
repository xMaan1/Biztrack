'use client';

import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { usePlanInfo } from './usePlanInfo';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './usePermissions';
import { apiService } from '../services/ApiService';
import { SIDEBAR_PATH_PERMISSIONS } from '@/src/constants/rbacPermissions';
import {
  allMenuItems,
  superAdminMenuItems,
} from '@/src/constants/sidebarMenuItems';
import type { MenuItem, SubMenuItem } from '@/src/types/sidebar';

const SIDEBAR_STORAGE_SEARCH = 'biztrack:sidebar:search';
const SIDEBAR_STORAGE_EXPANDED = 'biztrack:sidebar:expanded';
const SIDEBAR_STORAGE_SCROLL = 'biztrack:sidebar:scroll';

const MODULE_MAP: Record<string, string> = {
  CRM: 'crm',
  Customers: 'crm',
  Sales: 'sales',
  Invoicing: 'sales',
  HRM: 'hrm',
  'HRM Management': 'hrm',
  Inventory: 'inventory',
  Finance: 'finance',
  Banking: 'banking',
  Ledger: 'ledger',
  POS: 'pos',
  Projects: 'projects',
  'Project Management': 'projects',
  Production: 'production',
  'Workshop Management': 'production',
  'Quality Control': 'quality',
  Maintenance: 'maintenance',
  Events: 'events',
  Reports: 'reports',
  Dashboard: 'dashboard',
  'Donor Management': 'ngo',
  'Donation Management': 'ngo',
  'Gift & Inventory': 'ngo',
  'Volunteer Management': 'ngo',
  'Relief Projects': 'projects',
  'Charity Reports': 'reports',
  'Charity Events': 'events',
  'Charity Banking': 'banking',
  'Fund Accounting': 'ledger',
};

function getModuleForMenuItem(item: MenuItem): string | null {
  return MODULE_MAP[item.text] || null;
}

export function useSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const { planInfo, loading: planLoading } = usePlanInfo();
  const { user } = useAuth();
  const {
    accessibleModules,
    hasModuleAccess,
    hasPermission,
    isOwner,
    initializing: rbacInitializing,
  } = usePermissions();

  const navRef = useRef<HTMLElement | null>(null);
  const scrollSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didRestoreScrollRef = useRef(false);
  const [persistReady, setPersistReady] = useState(false);

  const purchaseOrdersNavLabel = useCallback(
    (subItem: SubMenuItem) =>
      subItem.path === '/inventory/purchase-orders' && planInfo?.planType === 'healthcare'
        ? 'Medical supply orders'
        : subItem.text,
    [planInfo?.planType],
  );

  const hasPathPermission = useCallback(
    (path?: string) => {
      if (!path || isOwner()) return true;
      if (path === '/sales/invoice-dashboard') {
        return (
          hasPermission('sales:invoices:view') ||
          hasPermission('sales:invoice_dashboard:view')
        );
      }
      const requiredPermission = SIDEBAR_PATH_PERMISSIONS[path];
      if (!requiredPermission) return true;
      return hasPermission(requiredPermission);
    },
    [hasPermission, isOwner],
  );

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(SIDEBAR_STORAGE_SEARCH);
      if (s !== null) setSearchQuery(s);
      const ex = sessionStorage.getItem(SIDEBAR_STORAGE_EXPANDED);
      if (ex) {
        const arr = JSON.parse(ex) as string[];
        if (Array.isArray(arr)) setExpandedItems(new Set(arr));
      }
    } catch {
    }
    setPersistReady(true);
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    try {
      sessionStorage.setItem(SIDEBAR_STORAGE_SEARCH, searchQuery);
    } catch {
    }
  }, [searchQuery, persistReady]);

  useEffect(() => {
    if (!persistReady) return;
    try {
      const expandedArr: string[] = [];
      expandedItems.forEach((x) => expandedArr.push(x));
      sessionStorage.setItem(SIDEBAR_STORAGE_EXPANDED, JSON.stringify(expandedArr));
    } catch {
    }
  }, [expandedItems, persistReady]);

  useLayoutEffect(() => {
    if (planLoading) return;
    const el = navRef.current;
    if (!el || didRestoreScrollRef.current) return;
    didRestoreScrollRef.current = true;
    try {
      const raw = sessionStorage.getItem(SIDEBAR_STORAGE_SCROLL);
      if (raw == null) return;
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) return;
      el.scrollTop = n;
    } catch {
    }
  }, [planLoading]);

  useEffect(() => {
    return () => {
      if (scrollSaveTimeoutRef.current) {
        clearTimeout(scrollSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleNavScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    if (scrollSaveTimeoutRef.current) {
      clearTimeout(scrollSaveTimeoutRef.current);
    }
    scrollSaveTimeoutRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(SIDEBAR_STORAGE_SCROLL, String(el.scrollTop));
      } catch {
      }
      scrollSaveTimeoutRef.current = null;
    }, 120);
  }, []);

  const toggleExpanded = useCallback((itemText: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemText)) {
        next.delete(itemText);
      } else {
        next.add(itemText);
      }
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => {
    const currentTenantId = apiService.getTenantId();
    if (user?.userRole === 'super_admin' && !currentTenantId) {
      return superAdminMenuItems.filter((item) => {
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return item.text.toLowerCase().includes(query);
        }
        return true;
      });
    }

    if (planLoading || !planInfo) return [];

    const currentPlanType = planInfo.planType;

    return allMenuItems.filter((item) => {
      const isAvailableForPlan =
        item.planTypes.includes('*') || item.planTypes.includes(currentPlanType);

      if (!isAvailableForPlan) return false;

      if (!isOwner()) {
        if (item.path && !hasPathPermission(item.path)) {
          return false;
        }
        const module = getModuleForMenuItem(item);
        if (module && !hasModuleAccess(module)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        if (item.text.toLowerCase().includes(query)) {
          return true;
        }

        if (item.subItems) {
          return item.subItems.some((subItem) => {
            const subItemAvailable =
              subItem.planTypes.includes('*') || subItem.planTypes.includes(currentPlanType);
            const label = purchaseOrdersNavLabel(subItem);
            return (
              subItemAvailable &&
              (label.toLowerCase().includes(query) || subItem.text.toLowerCase().includes(query))
            );
          });
        }

        return false;
      }

      return true;
    });
  }, [
    searchQuery,
    planInfo,
    planLoading,
    user,
    accessibleModules,
    hasModuleAccess,
    hasPathPermission,
    isOwner,
    purchaseOrdersNavLabel,
  ]);

  const filteredItemsRef = useRef(filteredItems);
  filteredItemsRef.current = filteredItems;

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    setExpandedItems((prev) => {
      const next = new Set(prev);
      let changed = false;
      filteredItemsRef.current.forEach((item) => {
        if (item.subItems?.length && !next.has(item.text)) {
          next.add(item.text);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [searchQuery, planLoading, planInfo?.planType, user?.userRole, rbacInitializing]);

  const isActive = useCallback(
    (path: string, exact: boolean = false) => {
      if (path === '/sales/invoice-dashboard') {
        return (
          pathname === '/sales/invoice-dashboard' ||
          pathname.startsWith('/sales/invoice-dashboard/') ||
          pathname === '/sales/invoices' ||
          pathname.startsWith('/sales/invoices/') ||
          pathname === '/invoices' ||
          pathname.startsWith('/invoices/')
        );
      }
      if (path === '/' || exact) {
        return pathname === path;
      }
      return pathname.startsWith(path);
    },
    [pathname],
  );

  const getPlanDisplayName = useCallback(() => {
    if (user?.userRole === 'super_admin') {
      return 'Super Admin';
    }
    if (!planInfo) return 'Loading...';

    switch (planInfo.planType) {
      case 'workshop':
        return 'Workshop Master';
      case 'commerce':
        return 'Commerce Pro';
      case 'agency':
        return 'Agency Pro';
      case 'healthcare':
        return 'Healthcare Suite';
      case 'ngo':
        return 'Charity Pro';
      default:
        return planInfo.planName;
    }
  }, [planInfo, user?.userRole]);

  const isSubItemAvailable = useCallback(
    (subItem: SubMenuItem) => {
      if (subItem.planTypes.includes('*')) return true;
      return planInfo != null && subItem.planTypes.includes(planInfo.planType);
    },
    [planInfo],
  );

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  return {
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
  };
}
