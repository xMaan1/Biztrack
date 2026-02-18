'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { usePlanInfo } from '../../hooks/usePlanInfo';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  Clock,
  BarChart3,
  UserCheck,
  Building,
  Calendar,
  X,
  Search,
  TrendingUp,
  Target,
  FileText,
  DollarSign,
  Briefcase,
  Award,
  GraduationCap,
  Clock3,
  ChevronDown,
  CreditCard,
  FileCheck,
  Banknote,
  BookOpen,
  Package,
  Receipt,
  Plus,
  Warehouse,
  MapPin,
  Truck,
  ClipboardList,
  PackageCheck,
  AlertTriangle,
  Factory,
  Wrench,
  Stethoscope,
  Pill,
  Building2,
  Settings,
  Trash2,
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  Bell,
} from 'lucide-react';

interface SubMenuItem {
  text: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  planTypes: string[]; // Add plan type restrictions
}

interface MenuItem {
  text: string;
  icon: React.ElementType;
  path?: string;
  roles: string[];
  planTypes: string[]; // Add plan type restrictions
  subItems?: SubMenuItem[];
  gradient: string;
}

const allMenuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['*'],
    planTypes: ['*'], // Available for all plans
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    text: 'CRM',
    icon: Users,
    roles: ['*'],
    planTypes: ['commerce', 'healthcare'], // Commerce and Healthcare focused
    gradient: 'from-blue-500 to-indigo-500',
    subItems: [
      {
        text: 'Dashboard',
        icon: LayoutDashboard,
        path: '/crm',
        roles: ['*'],
        planTypes: ['commerce', 'healthcare'],
      },
      {
        text: 'Customers',
        icon: Users,
        path: '/crm/customers',
        roles: ['*'],
        planTypes: ['commerce', 'healthcare'],
      },
      {
        text: 'Companies',
        icon: Building,
        path: '/crm/companies',
        roles: ['*'],
        planTypes: ['commerce', 'healthcare'],
      },
      {
        text: 'Contacts',
        icon: Users,
        path: '/crm/contacts',
        roles: ['*'],
        planTypes: ['commerce', 'healthcare'],
      },
      {
        text: 'Leads',
        icon: Target,
        path: '/crm/leads',
        roles: ['*'],
        planTypes: ['commerce', 'healthcare'],
      },
      {
        text: 'Opportunities',
        icon: TrendingUp,
        path: '/crm/opportunities',
        roles: ['*'],
        planTypes: ['commerce', 'healthcare'],
      },
    ],
  },
  {
    text: 'Customers',
    icon: Users,
    path: '/crm/customers',
    roles: ['*'],
    planTypes: ['workshop'], // Workshop plan - only customers needed
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    text: 'Invoicing',
    icon: Banknote,
    path: '/sales/invoices',
    roles: ['*'],
    planTypes: ['workshop', 'healthcare'], // Workshop and Healthcare plans - invoicing needed
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    text: 'Sales',
    icon: DollarSign,
    roles: ['*'],
    planTypes: ['commerce'], // Commerce focused
    gradient: 'from-green-500 to-emerald-500',
    subItems: [
      {
        text: 'Quotes',
        icon: FileText,
        path: '/sales/quotes',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Contracts',
        icon: FileCheck,
        path: '/sales/contracts',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Analytics',
        icon: BarChart3,
        path: '/sales/analytics',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Invoices',
        icon: Banknote,
        path: '/sales/invoices',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Sub Installments',
        icon: Calendar,
        path: '/sales/installments',
        roles: ['*'],
        planTypes: ['commerce'],
      },
    ],
  },
  {
    text: 'POS',
    icon: Banknote,
    roles: ['*'],
    planTypes: ['commerce'], // Commerce focused
    gradient: 'from-yellow-500 to-orange-500',
    subItems: [
      {
        text: 'Dashboard',
        icon: LayoutDashboard,
        path: '/pos',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'New Sale',
        icon: Plus,
        path: '/pos/sale',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Products',
        icon: Package,
        path: '/pos/products',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Transactions',
        icon: Receipt,
        path: '/pos/transactions',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Shifts',
        icon: Clock3,
        path: '/pos/shifts',
        roles: ['*'],
        planTypes: ['commerce'],
      },
      {
        text: 'Reports',
        icon: BarChart3,
        path: '/pos/reports',
        roles: ['*'],
        planTypes: ['commerce'],
      },
    ],
  },
  {
    text: 'Inventory',
    icon: Warehouse,
    roles: ['*'],
    planTypes: ['*'], // Available for all plans
    gradient: 'from-teal-500 to-green-500',
    subItems: [
      {
        text: 'Dashboard',
        icon: LayoutDashboard,
        path: '/inventory',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Warehouses',
        icon: Warehouse,
        path: '/inventory/warehouses',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Storage Locations',
        icon: MapPin,
        path: '/inventory/storage-locations',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Stock Movements',
        icon: Truck,
        path: '/inventory/stock-movements',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Purchase Orders',
        icon: ClipboardList,
        path: '/inventory/purchase-orders',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Receiving',
        icon: PackageCheck,
        path: '/inventory/receiving',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Products',
        icon: Package,
        path: '/inventory/products',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Stock Alerts',
        icon: AlertTriangle,
        path: '/inventory/alerts',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Dumps',
        icon: Trash2,
        path: '/inventory/dumps',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Return from Customer',
        icon: ArrowLeft,
        path: '/inventory/customer-returns',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Return to Supplier',
        icon: ArrowRight,
        path: '/inventory/supplier-returns',
        roles: ['*'],
        planTypes: ['*'],
      },
    ],
  },
  {
    text: 'HRM',
    icon: UserCheck,
    roles: ['*'],
    planTypes: ['*'],
    gradient: 'from-purple-500 to-pink-500',
    subItems: [
      {
        text: 'Dashboard',
        icon: LayoutDashboard,
        path: '/hrm',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Employees',
        icon: Users,
        path: '/hrm/employees',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Job Postings',
        icon: Briefcase,
        path: '/hrm/job-postings',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Performance Reviews',
        icon: Award,
        path: '/hrm/performance-reviews',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Leave Management',
        icon: Calendar,
        path: '/hrm/leave-management',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Training',
        icon: GraduationCap,
        path: '/hrm/training',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Payroll',
        icon: Banknote,
        path: '/hrm/payroll',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Suppliers',
        icon: Building,
        path: '/hrm/suppliers',
        roles: ['*'],
        planTypes: ['*'],
      },
    ],
  },
  {
    text: 'Project Management',
    icon: FolderOpen,
    roles: ['*'],
    planTypes: ['*'], // Available for all plans
    gradient: 'from-orange-500 to-red-500',
    subItems: [
      {
        text: 'Projects',
        icon: FolderOpen,
        path: '/projects',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Tasks',
        icon: CheckSquare,
        path: '/tasks',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Team Members',
        icon: Users,
        path: '/team',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Time Tracking',
        icon: Clock,
        path: '/time-tracking',
        roles: ['*'],
        planTypes: ['*'],
      },
    ],
  },
  {
    text: 'Reports',
    icon: BarChart3,
    path: '/reports',
    roles: ['*'],
    planTypes: ['*'],
    gradient: 'from-purple-500 to-violet-500',
  },
  {
    text: 'Events',
    icon: Calendar,
    path: '/events',
    roles: ['*'],
    planTypes: ['*'], 
    gradient: 'from-indigo-500 to-blue-500',
  },
  // Workshop-specific modules
  {
    text: 'Workshop Management',
    icon: Factory,
    roles: ['*'],
    planTypes: ['workshop'], // Workshop focused
    gradient: 'from-orange-500 to-red-500',
    subItems: [
      {
        text: 'Work Orders',
        icon: Wrench,
        path: '/workshop-management/work-orders',
        roles: ['*'],
        planTypes: ['workshop'],
      },
      {
        text: 'Job Cards',
        icon: ClipboardList,
        path: '/workshop-management/job-cards',
        roles: ['*'],
        planTypes: ['workshop'],
      },
      {
        text: 'Production Planning',
        icon: Factory,
        path: '/workshop-management/production',
        roles: ['*'],
        planTypes: ['workshop'],
      },
      {
        text: 'Quality Control',
        icon: CheckSquare,
        path: '/workshop-management/quality-control',
        roles: ['*'],
        planTypes: ['workshop'],
      },
      {
        text: 'Equipment Maintenance',
        icon: Wrench,
        path: '/workshop-management/maintenance',
        roles: ['*'],
        planTypes: ['workshop'],
      },
    ],
  },
  // Healthcare-specific modules
  {
    text: 'Healthcare',
    icon: Stethoscope,
    roles: ['*'],
    planTypes: ['healthcare'], // Healthcare focused
    gradient: 'from-blue-500 to-purple-500',
    subItems: [
      {
        text: 'Patients',
        icon: Users,
        path: '/patients',
        roles: ['*'],
        planTypes: ['healthcare'],
      },
      {
        text: 'Appointments',
        icon: Calendar,
        path: '/appointments',
        roles: ['*'],
        planTypes: ['healthcare'],
      },
      {
        text: 'Medical Records',
        icon: FileText,
        path: '/medical-records',
        roles: ['*'],
        planTypes: ['healthcare'],
      },
      {
        text: 'Medical Supplies',
        icon: Pill,
        path: '/medical-supplies',
        roles: ['*'],
        planTypes: ['healthcare'],
      },
      {
        text: 'Doctor Consultation',
        icon: UserCheck,
        path: '/consultations',
        roles: ['*'],
        planTypes: ['healthcare'],
      },
      {
        text: 'Lab Reports',
        icon: ClipboardList,
        path: '/lab-reports',
        roles: ['*'],
        planTypes: ['healthcare'],
      },
    ],
  },
  // Banking - Available for all plan types
  {
    text: 'Banking',
    icon: Banknote,
    roles: ['*'],
    planTypes: ['*'], // Available for all plans
    gradient: 'from-blue-500 to-indigo-500',
    subItems: [
      {
        text: 'Dashboard',
        icon: LayoutDashboard,
        path: '/banking',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Bank Accounts',
        icon: CreditCard,
        path: '/banking/accounts',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Transactions',
        icon: Receipt,
        path: '/banking/transactions',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Reconciliation',
        icon: CheckCircle,
        path: '/banking/reconciliation',
        roles: ['*'],
        planTypes: ['*'],
      },
    ],
  },
  // Ledger - Available for all plan types
  {
    text: 'Financial Ledger',
    icon: BookOpen,
    roles: ['*'],
    planTypes: ['*'], // Available for all plans
    gradient: 'from-emerald-500 to-teal-500',
    subItems: [
      {
        text: 'Dashboard',
        icon: LayoutDashboard,
        path: '/ledger',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Profit & Loss',
        icon: TrendingUp,
        path: '/ledger/profit-loss',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Investments',
        icon: DollarSign,
        path: '/ledger/investments',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Transactions',
        icon: Receipt,
        path: '/ledger/transactions',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Credit book (Account Receivable)',
        icon: FileText,
        path: '/ledger/account-receivables',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Reports',
        icon: BarChart3,
        path: '/ledger/reports',
        roles: ['*'],
        planTypes: ['*'],
      },
    ],
  },
  // Settings - Available for all plan types
  {
    text: 'Settings',
    icon: Settings,
    roles: ['*'],
    planTypes: ['*'], // Available for all plans
    gradient: 'from-gray-500 to-slate-500',
    subItems: [
      {
        text: 'General Settings',
        icon: Settings,
        path: '/settings',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Notifications',
        icon: Bell,
        path: '/notifications',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Notification Settings',
        icon: Settings,
        path: '/notifications/settings',
        roles: ['*'],
        planTypes: ['*'],
      },
      {
        text: 'Subscription',
        icon: CreditCard,
        path: '/subscription/manage',
        roles: ['owner', 'admin'],
        planTypes: ['*'],
      },
    ],
  },
  {
    text: 'User Management',
    icon: UserCheck,
    path: '/users',
    roles: ['owner', 'admin'],
    planTypes: ['*'],
    gradient: 'from-purple-500 to-violet-500',
  },
];

// Super admin menu items - only show Tenants, Plans, and Subscriptions
const superAdminMenuItems: MenuItem[] = [
  {
    text: 'Tenants',
    icon: Building2,
    path: '/admin/tenants',
    roles: ['super_admin'],
    planTypes: ['*'],
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    text: 'Plans',
    icon: CreditCard,
    path: '/admin/plans',
    roles: ['super_admin'],
    planTypes: ['*'],
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    text: 'Subscriptions',
    icon: CreditCard,
    path: '/admin/subscriptions',
    roles: ['super_admin'],
    planTypes: ['*'],
    gradient: 'from-blue-500 to-cyan-500',
  },
];

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const { planInfo, loading: planLoading } = usePlanInfo();
  const { user } = useAuth();
  const { accessibleModules, hasModuleAccess, isOwner } = usePermissions();

  const toggleExpanded = (itemText: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemText)) {
      newExpanded.delete(itemText);
    } else {
      newExpanded.add(itemText);
    }
    setExpandedItems(newExpanded);
  };

  // Map menu items to modules
  const getModuleForMenuItem = (item: MenuItem): string | null => {
    const moduleMap: Record<string, string> = {
      'CRM': 'crm',
      'Customers': 'crm',
      'Sales': 'sales',
      'Invoicing': 'sales',
      'HRM': 'hrm',
      'HRM Management': 'hrm',
      'Inventory': 'inventory',
      'Finance': 'finance',
      'Banking': 'banking',
      'Ledger': 'ledger',
      'POS': 'pos',
      'Projects': 'projects',
      'Project Management': 'projects',
      'Production': 'production',
      'Workshop Management': 'production',
      'Quality Control': 'quality',
      'Maintenance': 'maintenance',
      'Events': 'events',
      'Reports': 'reports',
      'Dashboard': 'dashboard',
    };
    return moduleMap[item.text] || null;
  };

  // Map sub-item text to module name for permission checking
  const getModuleForSubItem = (itemText: string): string | null => {
    const subItemModuleMap: Record<string, string | undefined> = {
      'Dashboard': undefined,
      'Customers': 'crm',
      'Companies': 'crm',
      'Contacts': 'crm',
      'Leads': 'crm',
      'Opportunities': 'crm',
      'Quotes': 'sales',
      'Invoices': 'sales',
      'Payment Receipts': 'sales',
      'Products': 'inventory',
      'Orders': 'inventory',
      'Categories': 'inventory',
      'Projects': 'projects',
      'Tasks': 'projects',
      'Team Members': 'projects',
      'Time Tracking': 'projects',
    };
    return subItemModuleMap[itemText] || null;
  };

  // Filter menu items based on user role and plan type
  const filteredItems = useMemo(() => {
    // If user is super admin, only show super admin menu items
    if (user?.userRole === 'super_admin') {
      return superAdminMenuItems.filter((item) => {
        // If searching, check if main item matches
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return item.text.toLowerCase().includes(query);
        }
        return true;
      });
    }

    // If plan info is still loading, return empty array to prevent showing all items
    if (planLoading || !planInfo) return [];

    const currentPlanType = planInfo.planType;

    return allMenuItems.filter((item) => {
      // Check if item is available for current plan
      const isAvailableForPlan =
        item.planTypes.includes('*') ||
        item.planTypes.includes(currentPlanType);

      if (!isAvailableForPlan) return false;

      // Check user permissions - owners see everything
      if (!isOwner()) {
        const module = getModuleForMenuItem(item);
        if (module && !hasModuleAccess(module)) {
          return false;
        }
      }

      // If searching, check if main item or sub-items match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        // Check if main item matches
        if (item.text.toLowerCase().includes(query)) {
          return true;
        }

        // Check if any sub-item matches
        if (item.subItems) {
          return item.subItems.some((subItem) => {
            const subItemAvailable =
              subItem.planTypes.includes('*') ||
              subItem.planTypes.includes(currentPlanType);
            return (
              subItemAvailable && subItem.text.toLowerCase().includes(query)
            );
          });
        }

        return false;
      }

      return true;
    });
  }, [searchQuery, planInfo, planLoading, user, accessibleModules, hasModuleAccess, isOwner]);

  // Handle auto-expanding items when searching
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const query = searchQuery.toLowerCase();
    const newExpanded = new Set(expandedItems);

    filteredItems.forEach((item) => {
      if (
        item.subItems &&
        item.subItems.some((subItem) => {
          // For super admin, all sub-items are available
          if (user?.userRole === 'super_admin') {
            return subItem.text.toLowerCase().includes(query);
          }
          // For regular users, check plan availability
          const subItemAvailable =
            subItem.planTypes.includes('*') ||
            (planInfo && subItem.planTypes.includes(planInfo.planType));
          return subItemAvailable && subItem.text.toLowerCase().includes(query);
        })
      ) {
        newExpanded.add(item.text);
      }
    });

    setExpandedItems(newExpanded);
  }, [searchQuery, filteredItems, planInfo, planLoading, user]);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Show plan info in header
  const getPlanDisplayName = () => {
    if (user?.userRole === 'super_admin') {
      return 'Super Admin';
    }
    if (!planInfo) return 'Loading...';

    switch (planInfo.planType) {
      case 'workshop':
        return 'Workshop Master';
      case 'commerce':
        return 'Commerce Pro';
      case 'healthcare':
        return 'Healthcare Suite';
      default:
        return planInfo.planName;
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border-r border-gray-200 shadow-xl w-64 h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            BizTrack
          </h2>
        </div>
        {planInfo && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 mb-1">Current Plan</div>
            <div className="text-sm font-semibold text-gray-700">
              {getPlanDisplayName()}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search modules and pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-500">
            Searching modules and pages...
          </div>
        )}
      </div>

      <nav className="p-4 space-y-3 flex-1 overflow-y-auto">
        {planLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItems.has(item.text);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isMainItemActive = item.path && isActive(item.path);
            const hasActiveSubItem =
              hasSubItems &&
              item.subItems!.some((subItem) => isActive(subItem.path));

            return (
              <div key={item.text} className="space-y-1">
                {item.path ? (
                  <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer',
                    isMainItemActive
                      ? 'bg-gradient-to-r ' +
                          item.gradient +
                          ' text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100',
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      isMainItemActive
                        ? 'bg-white/20'
                        : 'bg-gray-100 group-hover:bg-gray-200',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        isMainItemActive ? 'text-white' : 'text-gray-600',
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'font-medium transition-colors flex-1',
                      isMainItemActive ? 'text-white' : 'text-gray-700',
                    )}
                  >
                    {item.text}
                  </span>
                  {isMainItemActive && !hasSubItems && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => toggleExpanded(item.text)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer',
                    hasActiveSubItem
                      ? 'bg-gradient-to-r ' +
                          item.gradient +
                          ' text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        hasActiveSubItem
                          ? 'bg-white/20'
                          : 'bg-gray-100 group-hover:bg-gray-200',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 transition-colors',
                          hasActiveSubItem ? 'text-white' : 'text-gray-600',
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'font-medium transition-colors flex-1',
                        hasActiveSubItem ? 'text-white' : 'text-gray-700',
                      )}
                    >
                      {item.text}
                    </span>
                  </div>
                  {hasSubItems && (
                    <div
                      className={cn(
                        'p-1 rounded transition-transform duration-200',
                        isExpanded ? 'rotate-180' : 'rotate-0',
                      )}
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-colors',
                          hasActiveSubItem ? 'text-white' : 'text-gray-500',
                        )}
                      />
                    </div>
                  )}
                </button>
              )}

              {hasSubItems && isExpanded && (
                <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-4">
                  {item.subItems!.map((subItem) => {
                    const isSubItemActive = isActive(subItem.path);
                    const subItemAvailable =
                      subItem.planTypes.includes('*') ||
                      (planInfo &&
                        subItem.planTypes.includes(planInfo.planType));

                    if (!subItemAvailable) return null;

                    const subItemModule = getModuleForSubItem(subItem.text);
                    if (!isOwner() && subItemModule && !hasModuleAccess(subItemModule)) {
                      return null;
                    }

                    return (
                      <Link
                        key={subItem.text}
                        href={subItem.path}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group',
                          isSubItemActive
                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800',
                        )}
                      >
                        <div
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            isSubItemActive
                              ? 'bg-blue-100'
                              : 'bg-gray-100 group-hover:bg-gray-200',
                          )}
                        >
                          <subItem.icon
                            className={cn(
                              'h-4 w-4 transition-colors',
                              isSubItemActive
                                ? 'text-blue-600'
                                : 'text-gray-500',
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-sm font-medium transition-colors',
                            isSubItemActive ? 'text-blue-700' : 'text-gray-600',
                          )}
                        >
                          {subItem.text}
                        </span>
                        {isSubItemActive && (
                          <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }))}
        

        {filteredItems.length === 0 && searchQuery && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">No matches found</p>
            <p className="text-xs mt-1">
              Try searching for module names or page titles
            </p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Powered by</p>
          <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            BizTrack Technologies
          </p>
        </div>
      </div>
    </div>
  );
}
