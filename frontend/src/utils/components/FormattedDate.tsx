'use client';

import React from 'react';
import { formatDate, formatDateTime, formatTime, formatDateLong, getRelativeTime } from '../date';

interface FormattedDateProps {
  date: string | Date;
  format?: 'relative' | 'short' | 'long' | 'time' | 'datetime';
  className?: string;
}

export function FormattedDate({ 
  date, 
  format = 'short',
  className = '' 
}: FormattedDateProps) {
  const formatDate = (date: string | Date, format: string) => {
    switch (format) {
      case 'relative':
        return getRelativeTime(date);
      case 'short':
        return formatDate(date);
      case 'long':
        return formatDateLong(date);
      case 'time':
        return formatTime(date);
      case 'datetime':
        return formatDateTime(date);
      default:
        return formatDate(date);
    }
  };

  return (
    <span className={className}>
      {formatDate(date, format)}
    </span>
  );
}
