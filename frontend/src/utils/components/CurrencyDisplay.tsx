'use client';

import React from 'react';
import { formatCurrency, formatNumber } from '../format';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  showSymbol?: boolean;
  className?: string;
}

export function CurrencyDisplay({ 
  amount, 
  currency = 'USD',
  locale = 'en-US',
  showSymbol = true,
  className = ''
}: CurrencyDisplayProps) {
  return (
    <span className={className}>
      {showSymbol 
        ? formatCurrency(amount, currency, locale)
        : formatNumber(amount, locale)
      }
    </span>
  );
}
