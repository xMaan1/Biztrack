'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  TrendingUp,
  DollarSign,
  Calculator,
  ShoppingCart,
  RefreshCw,
  Mail,
  MessageCircle,
  Download,
} from 'lucide-react';
import { LedgerService } from '@/src/services/ledgerService';
import DashboardLayout from '@/src/components/layout/DashboardLayout';
import {
  ProfitLossDashboard,
  ProfitLossPeriod,
  getProfitLossPeriodLabel,
} from '@/src/models/ledger';
import { useCurrency } from '@/src/contexts/CurrencyContext';
import { useCachedApi } from '@/src/hooks/useCachedApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function ProfitLossDashboardPage() {
  const { formatCurrency, loading: currencyLoading } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<ProfitLossPeriod>(ProfitLossPeriod.MONTH);
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | null>(null);

  const { data: dashboardData, loading, refetch } = useCachedApi<ProfitLossDashboard>(
    `profit_loss_dashboard_${selectedPeriod}_${customDateRange?.start || ''}_${customDateRange?.end || ''}`,
    () => LedgerService.getProfitLossDashboard(
      selectedPeriod,
      customDateRange?.start,
      customDateRange?.end
    ),
    { ttl: 300000 }
  );

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as ProfitLossPeriod);
    setCustomDateRange(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleShareWhatsApp = () => {
    if (!dashboardData) return;
    
    const message = `📊 *Profit/Loss Report - ${getProfitLossPeriodLabel(selectedPeriod)}*
    
💰 *Summary:*
• Total Sales: ${formatCurrency(dashboardData.summary.total_sales)}
• Total Purchases: ${formatCurrency(dashboardData.summary.total_purchases)}
• Gross Profit: ${formatCurrency(dashboardData.summary.gross_profit)}
• Net Profit: ${formatCurrency(dashboardData.summary.net_profit)}

📈 *Sales:*
• Invoices: ${dashboardData.sales.total_invoices}
• Paid: ${dashboardData.sales.paid_invoices}
• Pending: ${dashboardData.sales.pending_invoices}
• Overdue: ${dashboardData.sales.overdue_invoices}

📦 *Purchases:*
• Orders: ${dashboardData.purchases.total_purchase_orders}
• Completed: ${dashboardData.purchases.completed_purchases}
• Pending: ${dashboardData.purchases.pending_purchases}

📊 *Inventory:*
• Products: ${dashboardData.inventory.total_products}
• Value: ${formatCurrency(dashboardData.inventory.total_inventory_value)}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleShareEmail = () => {
    if (!dashboardData) return;
    
    const subject = `Profit/Loss Report - ${getProfitLossPeriodLabel(selectedPeriod)}`;
    const body = `Profit/Loss Report - ${getProfitLossPeriodLabel(selectedPeriod)}

SUMMARY:
• Total Sales: ${formatCurrency(dashboardData.summary.total_sales)}
• Total Purchases: ${formatCurrency(dashboardData.summary.total_purchases)}
• Gross Profit: ${formatCurrency(dashboardData.summary.gross_profit)}
• Net Profit: ${formatCurrency(dashboardData.summary.net_profit)}

SALES:
• Total Invoices: ${dashboardData.sales.total_invoices}
• Paid Invoices: ${dashboardData.sales.paid_invoices}
• Pending Invoices: ${dashboardData.sales.pending_invoices}
• Overdue Invoices: ${dashboardData.sales.overdue_invoices}

PURCHASES:
• Total Purchase Orders: ${dashboardData.purchases.total_purchase_orders}
• Completed Purchases: ${dashboardData.purchases.completed_purchases}
• Pending Purchases: ${dashboardData.purchases.pending_purchases}

INVENTORY:
• Total Products: ${dashboardData.inventory.total_products}
• Inventory Value: ${formatCurrency(dashboardData.inventory.total_inventory_value)}

Generated on: ${new Date().toLocaleDateString()}`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.open(`mailto:?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
  };

  const handleDownloadReport = () => {
    if (!dashboardData) return;
    
    const reportData = {
      reportPeriod: getProfitLossPeriodLabel(selectedPeriod),
      dateRange: `${dashboardData.start_date} to ${dashboardData.end_date}`,
      generatedAt: new Date().toISOString(),
      ...dashboardData
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profit-loss-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartData = dashboardData?.daily_breakdown.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sales: item.sales,
    purchases: item.purchases,
    profit: item.profit
  })) || [];

  const pieData = dashboardData ? [
    { name: 'Sales', value: dashboardData.summary.total_sales, color: '#10b981' },
    { name: 'Purchases', value: dashboardData.summary.total_purchases, color: '#ef4444' },
    { name: 'Inventory', value: dashboardData.summary.inventory_value, color: '#3b82f6' }
  ] : [];

  if (loading || currencyLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Profit & Loss Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive financial overview with sales, purchases, and inventory data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProfitLossPeriod.DAY}>Today</SelectItem>
                <SelectItem value={ProfitLossPeriod.WEEK}>This Week</SelectItem>
                <SelectItem value={ProfitLossPeriod.MONTH}>This Month</SelectItem>
                <SelectItem value={ProfitLossPeriod.YEAR}>This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {dashboardData && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData.summary.total_sales)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.sales.total_invoices} invoices
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(dashboardData.summary.total_purchases)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.purchases.total_purchase_orders} orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                  <Calculator className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dashboardData.summary.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboardData.summary.gross_profit)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sales - Purchases
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dashboardData.summary.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dashboardData.summary.net_profit)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Payments - Purchases
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>Invoice and payment statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.sales.paid_invoices}
                      </div>
                      <div className="text-sm text-muted-foreground">Paid Invoices</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {dashboardData.sales.pending_invoices}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending Invoices</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData.sales.overdue_invoices}
                      </div>
                      <div className="text-sm text-muted-foreground">Overdue Invoices</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dashboardData.sales.total_payments_received)}
                      </div>
                      <div className="text-sm text-muted-foreground">Payments Received</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Overview</CardTitle>
                  <CardDescription>Purchase order statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.purchases.completed_purchases}
                      </div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {dashboardData.purchases.pending_purchases}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.purchases.total_purchase_orders}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(dashboardData.purchases.total_purchases)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Value</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Overview</CardTitle>
                  <CardDescription>Current inventory status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.inventory.total_products}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(dashboardData.inventory.total_inventory_value)}
                      </div>
                      <div className="text-sm text-muted-foreground">Inventory Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.inventory.inbound_movements}
                      </div>
                      <div className="text-sm text-muted-foreground">Inbound Movements</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {dashboardData.inventory.outbound_movements}
                      </div>
                      <div className="text-sm text-muted-foreground">Outbound Movements</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quotes & Contracts</CardTitle>
                  <CardDescription>Sales pipeline overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {dashboardData.quotes_contracts.total_quotes}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Quotes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(dashboardData.quotes_contracts.quotes_value)}
                      </div>
                      <div className="text-sm text-muted-foreground">Quotes Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.quotes_contracts.total_contracts}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Contracts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(dashboardData.quotes_contracts.contracts_value)}
                      </div>
                      <div className="text-sm text-muted-foreground">Contracts Value</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Performance</CardTitle>
                  <CardDescription>Sales, purchases, and profit trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="purchases" stroke="#ef4444" strokeWidth={2} />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution</CardTitle>
                  <CardDescription>Sales vs purchases vs inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Share Report</CardTitle>
                <CardDescription>Export or share this profit/loss report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button onClick={handleShareWhatsApp} variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Share on WhatsApp
                  </Button>
                  <Button onClick={handleShareEmail} variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Share via Email
                  </Button>
                  <Button onClick={handleDownloadReport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
