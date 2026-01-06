import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import InvoiceCustomizationService from '@/services/InvoiceCustomizationService';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number, customCurrency?: string) => string;
  getCurrencySymbol: (customCurrency?: string) => string;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'selected_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [loading, setLoading] = useState(true);
  const { user, currentTenant } = useAuth();

  useEffect(() => {
    if (user && currentTenant) {
      loadCurrencySettings();
    } else if (user && !currentTenant) {
      loadStoredCurrency();
    } else {
      loadStoredCurrency();
    }
  }, [user, currentTenant]);

  const loadStoredCurrency = async () => {
    try {
      const storedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (storedCurrency) {
        setCurrencyState(storedCurrency);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadCurrencySettings = async () => {
    try {
      setLoading(true);
      const customization = await InvoiceCustomizationService.getCustomization();
      const currencyFromSettings = customization.default_currency || 'USD';
      setCurrencyState(currencyFromSettings);
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currencyFromSettings);
    } catch (error: any) {
      if (error?.response?.status === 400 && error?.response?.data?.detail?.includes('Tenant context required')) {
      }
      const storedCurrency = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
      if (storedCurrency) {
        setCurrencyState(storedCurrency);
      }
    } finally {
      setLoading(false);
    }
  };

  const setCurrency = async (newCurrency: string) => {
    setCurrencyState(newCurrency);
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch (error) {
    }
  };

  const formatCurrency = (amount: number, customCurrency?: string): string => {
    const currencyToUse = customCurrency || currency;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyToUse,
      }).format(amount);
    } catch (error) {
      return `${currencyToUse} ${amount.toFixed(2)}`;
    }
  };

  const getCurrencySymbol = (customCurrency?: string): string => {
    const currencyToUse = customCurrency || currency;
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyToUse,
      });
      const parts = formatter.formatToParts(0);
      const currencyPart = parts.find(part => part.type === 'currency');
      return currencyPart?.value || getDefaultCurrencySymbol(currencyToUse);
    } catch (error) {
      return getDefaultCurrencySymbol(currencyToUse);
    }
  };

  const getDefaultCurrencySymbol = (currencyCode: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥',
      CNY: '¥',
      INR: '₹',
      BRL: 'R$',
      MXN: '$',
      KRW: '₩',
      SGD: 'S$',
      HKD: 'HK$',
      NZD: 'NZ$',
      CHF: 'CHF',
      SEK: 'kr',
      NOK: 'kr',
      DKK: 'kr',
      PLN: 'zł',
      TRY: '₺',
      RUB: '₽',
      ZAR: 'R',
    };
    return symbols[currencyCode] || currencyCode;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        getCurrencySymbol,
        loading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}


