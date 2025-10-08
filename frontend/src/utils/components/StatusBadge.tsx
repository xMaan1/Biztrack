'use client';

import React from 'react';
import { Badge } from '../../components/ui/badge';
import { getStatusBadgeVariant } from '../status';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

export function StatusBadge({ 
  status, 
  variant, 
  className = '' 
}: StatusBadgeProps) {
  const badgeVariant = variant || getStatusBadgeVariant(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

  return (
    <Badge variant={badgeVariant} className={className}>
      {label}
    </Badge>
  );
}
