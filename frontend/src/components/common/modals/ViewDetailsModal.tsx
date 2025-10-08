'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';

interface ViewDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any;
  fields: Array<{
    key: string;
    label: string;
    type?: 'text' | 'date' | 'currency' | 'badge' | 'array';
    format?: (value: any) => string;
    render?: (value: any) => React.ReactNode;
  }>;
  maxWidth?: string;
  showEditButton?: boolean;
  onEdit?: () => void;
}

export function ViewDetailsModal({
  open,
  onOpenChange,
  title,
  data,
  fields,
  maxWidth = 'sm:max-w-[600px]',
  showEditButton = false,
  onEdit,
}: ViewDetailsModalProps) {
  const renderFieldValue = (field: any, value: any) => {
    if (field.render) {
      return field.render(value);
    }

    if (field.format) {
      return field.format(value);
    }

    if (field.type === 'array' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 rounded text-sm"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    if (field.type === 'badge') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
          {value}
        </span>
      );
    }

    return value || 'Not specified';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-gray-500">
                  {field.label}
                </label>
                <div className="text-sm text-gray-900 mt-1">
                  {renderFieldValue(field, data[field.key])}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {showEditButton && onEdit && (
            <Button type="button" onClick={onEdit}>
              Edit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
