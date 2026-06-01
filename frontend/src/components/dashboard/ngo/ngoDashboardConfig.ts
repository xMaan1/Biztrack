import type { LucideIcon } from 'lucide-react';
import {
  CircleDollarSign,
  FileText,
  Gift,
  UserPlus,
} from 'lucide-react';

export type NgoQuickAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  iconClass: string;
};

export const NGO_QUICK_ACTIONS: NgoQuickAction[] = [
  {
    href: '/sales/invoices',
    label: 'New Donation',
    icon: CircleDollarSign,
    iconClass: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  },
  {
    href: '/crm/customers',
    label: 'Add Donor',
    icon: UserPlus,
    iconClass: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
  },
  {
    href: '/inventory',
    label: 'Gift Inventory',
    icon: Gift,
    iconClass: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
  },
  {
    href: '/reports',
    label: 'Generate Report',
    icon: FileText,
    iconClass: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
  },
];

export const NGO_QUICK_LINKS = [
  { href: '/projects', label: 'Relief projects' },
  { href: '/crm/customers', label: 'Donors' },
  { href: '/crm/leads', label: 'Donation leads' },
  { href: '/events', label: 'Charity events' },
  { href: '/ledger', label: 'Fund accounting' },
  { href: '/hrm', label: 'Volunteers & staff' },
] as const;

export type NgoStatAccent = 'emerald' | 'blue' | 'purple' | 'orange';
