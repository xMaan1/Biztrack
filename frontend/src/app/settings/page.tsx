"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { DashboardLayout } from "@/src/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { 
  Settings, 
  DollarSign, 
  Save, 
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import InvoiceCustomizationService from "@/src/services/InvoiceCustomizationService";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { currency, setCurrency, formatCurrency, loading: currencyLoading } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSelectedCurrency(currency);
    setHasChanges(false);
  }, [currency]);

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
    setHasChanges(newCurrency !== currency);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update the currency in the invoice customization
      await InvoiceCustomizationService.updateCustomization({
        default_currency: selectedCurrency
      });
      
      // Update the global currency context
      setCurrency(selectedCurrency);
      setHasChanges(false);
      
      toast.success("Currency settings updated successfully!");
    } catch (error) {
      console.error("Failed to update currency settings:", error);
      toast.error("Failed to update currency settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedCurrencyInfo = CURRENCIES.find(c => c.code === selectedCurrency);

  if (currencyLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your application preferences</p>
            </div>
          </div>

          {/* Currency Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Settings
              </CardTitle>
              <CardDescription>
                Set your default currency for invoices, transactions, and financial displays
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={selectedCurrency}
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{curr.symbol}</span>
                          <span>{curr.name} ({curr.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCurrencyInfo && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Selected Currency</p>
                      <p className="text-sm text-gray-600">
                        {selectedCurrencyInfo.name} ({selectedCurrencyInfo.code})
                      </p>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {selectedCurrencyInfo.symbol}
                    </Badge>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preview:</p>
                    <div className="flex gap-4 text-sm">
                      <span>Price: {formatCurrency(99.99)}</span>
                      <span>Total: {formatCurrency(1250.50)}</span>
                      <span>Tax: {formatCurrency(125.05)}</span>
                    </div>
                  </div>
                </div>
              )}

              {hasChanges && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    You have unsaved changes. Don't forget to save your settings.
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Additional Settings
              </CardTitle>
              <CardDescription>
                More customization options will be available here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>More settings options coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
