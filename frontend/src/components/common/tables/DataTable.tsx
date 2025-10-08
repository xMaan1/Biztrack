'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../ui/dropdown-menu';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface Action {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  onClick: (row: any) => void;
  show?: (row: any) => boolean;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  actions?: Action[];
  loading?: boolean;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  onRowClick?: (row: any) => void;
  className?: string;
}

export function DataTable({
  data,
  columns,
  actions = [],
  loading = false,
  emptyState,
  onRowClick,
  className = '',
}: DataTableProps) {
  const getDefaultActions = (row: any): Action[] => {
    const defaultActions: Action[] = [
      {
        key: 'view',
        label: 'View',
        icon: <Eye className="h-4 w-4" />,
        variant: 'outline',
        onClick: () => {},
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <Edit className="h-4 w-4" />,
        variant: 'outline',
        onClick: () => {},
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        variant: 'outline',
        onClick: () => {},
      },
    ];
    return defaultActions;
  };

  const renderCellValue = (column: Column, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    return value;
  };

  const getVisibleActions = (row: any) => {
    const allActions = actions.length > 0 ? actions : getDefaultActions(row);
    return allActions.filter(action => !action.show || action.show(row));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground">
            {emptyState.icon}
          </div>
          <h3 className="text-lg font-medium mb-2">{emptyState.title}</h3>
          <p className="text-muted-foreground mb-4">{emptyState.description}</p>
          {emptyState.action && (
            <Button onClick={emptyState.action.onClick}>
              {emptyState.action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.width}>
                  {column.label}
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={row.id || index}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {renderCellValue(column, row)}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell>
                    <div className="flex gap-2">
                      {getVisibleActions(row).slice(0, 3).map((action) => (
                        <Button
                          key={action.key}
                          variant={action.variant || 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                        >
                          {action.icon}
                        </Button>
                      ))}
                      {getVisibleActions(row).length > 3 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {getVisibleActions(row).slice(3).map((action) => (
                              <DropdownMenuItem
                                key={action.key}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(row);
                                }}
                                className={action.variant === 'destructive' ? 'text-red-600' : ''}
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
