'use client';

import React from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground">
          {icon}
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
