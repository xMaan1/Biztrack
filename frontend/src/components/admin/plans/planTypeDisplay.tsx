import type { ReactNode } from 'react';
import {
  Building2,
  CreditCard,
  Package,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export function getPlanTypeIcon(planType: string): ReactNode {
  const Icon = getPlanTypeIconComponent(planType);
  return <Icon className={getPlanTypeIconClassName(planType)} />;
}

function getPlanTypeIconComponent(planType: string): LucideIcon {
  switch (planType.toLowerCase()) {
    case 'starter':
      return Star;
    case 'professional':
      return Zap;
    case 'enterprise':
      return Package;
    case 'agency':
      return Building2;
    default:
      return CreditCard;
  }
}

function getPlanTypeIconClassName(planType: string): string {
  switch (planType.toLowerCase()) {
    case 'starter':
      return 'h-5 w-5 text-green-500';
    case 'professional':
      return 'h-5 w-5 text-blue-500';
    case 'enterprise':
      return 'h-5 w-5 text-purple-500';
    case 'agency':
      return 'h-5 w-5 text-indigo-600';
    default:
      return 'h-5 w-5 text-gray-500';
  }
}

export function getPlanTypeColor(planType: string): string {
  switch (planType.toLowerCase()) {
    case 'starter':
      return 'bg-green-100 text-green-800';
    case 'professional':
      return 'bg-blue-100 text-blue-800';
    case 'enterprise':
      return 'bg-purple-100 text-purple-800';
    case 'agency':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
