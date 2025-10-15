import { apiService } from './ApiService';
import {
  BankAccount,
  BankAccountCreate,
  BankAccountUpdate,
  BankAccountResponse,
  BankAccountsResponse,
  BankTransaction,
  BankTransactionCreate,
  BankTransactionUpdate,
  BankTransactionResponse,
  BankTransactionsResponse,
  OnlineTransaction,
  OnlineTransactionCreate,
  OnlineTransactionUpdate,
  OnlineTransactionResponse,
  OnlineTransactionsResponse,
  CashPosition,
  CashPositionResponse,
  BankingDashboard,
  ReconciliationSummary,
  TransactionReconciliation,
  AccountBalance,
  TransactionType,
  TransactionStatus,
} from '../models/banking';

class BankingService {
  private baseUrl = '/banking';

  // Bank Account Methods
  async createBankAccount(account: BankAccountCreate): Promise<BankAccount> {
    // Convert camelCase to snake_case for backend
    const backendData = {
      account_name: account.accountName,
      account_number: account.accountNumber,
      routing_number: account.routingNumber,
      bank_name: account.bankName,
      bank_code: account.bankCode,
      account_type: account.accountType,
      currency: account.currency || 'USD',
      current_balance: account.currentBalance || 0,
      available_balance: account.availableBalance || 0,
      pending_balance: account.pendingBalance || 0,
      is_active: account.isActive !== false,
      is_primary: account.isPrimary || false,
      supports_online_banking: account.supportsOnlineBanking || false,
      description: account.description,
      tags: account.tags || [],
    };
    
    const response = await apiService.post<any>(`${this.baseUrl}/accounts`, backendData);
    // Backend returns bank_account (snake_case), frontend expects bankAccount (camelCase)
    return response.bank_account || response.bankAccount;
  }

  async getBankAccounts(activeOnly: boolean = false): Promise<BankAccount[]> {
    const params = activeOnly ? '?active_only=true' : '';
    const response = await apiService.get<any>(`${this.baseUrl}/accounts${params}`);
    // Backend returns bank_accounts (snake_case), frontend expects bankAccounts (camelCase)
    return response?.bank_accounts || response?.bankAccounts || [];
  }

  async getBankAccount(accountId: string): Promise<BankAccount> {
    const response = await apiService.get<any>(`${this.baseUrl}/accounts/${accountId}`);
    // Backend returns bank_account (snake_case), frontend expects bankAccount (camelCase)
    return response.bank_account || response.bankAccount;
  }

  async updateBankAccount(accountId: string, account: BankAccountUpdate): Promise<BankAccount> {
    // Convert camelCase to snake_case for backend
    const backendData: any = {};
    
    if (account.accountName !== undefined) backendData.account_name = account.accountName;
    if (account.routingNumber !== undefined) backendData.routing_number = account.routingNumber;
    if (account.bankName !== undefined) backendData.bank_name = account.bankName;
    if (account.bankCode !== undefined) backendData.bank_code = account.bankCode;
    if (account.accountType !== undefined) backendData.account_type = account.accountType;
    if (account.currency !== undefined) backendData.currency = account.currency;
    if (account.currentBalance !== undefined) backendData.current_balance = account.currentBalance;
    if (account.availableBalance !== undefined) backendData.available_balance = account.availableBalance;
    if (account.pendingBalance !== undefined) backendData.pending_balance = account.pendingBalance;
    if (account.isActive !== undefined) backendData.is_active = account.isActive;
    if (account.isPrimary !== undefined) backendData.is_primary = account.isPrimary;
    if (account.supportsOnlineBanking !== undefined) backendData.supports_online_banking = account.supportsOnlineBanking;
    if (account.description !== undefined) backendData.description = account.description;
    if (account.tags !== undefined) backendData.tags = account.tags;
    
    const response = await apiService.put<any>(`${this.baseUrl}/accounts/${accountId}`, backendData);
    // Backend returns bank_account (snake_case), frontend expects bankAccount (camelCase)
    return response.bank_account || response.bankAccount;
  }

  async deleteBankAccount(accountId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/accounts/${accountId}`);
  }

  async getAccountBalance(accountId: string, asOfDate?: string): Promise<AccountBalance> {
    const params = asOfDate ? `?as_of_date=${asOfDate}` : '';
    return await apiService.get<AccountBalance>(`${this.baseUrl}/accounts/${accountId}/balance${params}`);
  }

  // Bank Transaction Methods
  async createBankTransaction(transaction: BankTransactionCreate): Promise<BankTransaction> {
    const response = await apiService.post<BankTransactionResponse>(`${this.baseUrl}/transactions`, transaction);
    return response.bankTransaction;
  }

  async getBankTransactions(params?: {
    skip?: number;
    limit?: number;
    accountId?: string;
    transactionType?: TransactionType;
    status?: TransactionStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<BankTransaction[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.accountId) queryParams.append('account_id', params.accountId);
    if (params?.transactionType) queryParams.append('transaction_type', params.transactionType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);

    const queryString = queryParams.toString();
    const url = `${this.baseUrl}/transactions${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get<BankTransactionsResponse>(url);
    return response.bankTransactions;
  }

  async getBankTransaction(transactionId: string): Promise<BankTransaction> {
    const response = await apiService.get<BankTransactionResponse>(`${this.baseUrl}/transactions/${transactionId}`);
    return response.bankTransaction;
  }

  async updateBankTransaction(transactionId: string, transaction: BankTransactionUpdate): Promise<BankTransaction> {
    const response = await apiService.put<BankTransactionResponse>(`${this.baseUrl}/transactions/${transactionId}`, transaction);
    return response.bankTransaction;
  }

  async reconcileTransaction(transactionId: string, reconciliation: TransactionReconciliation): Promise<void> {
    await apiService.post(`${this.baseUrl}/transactions/${transactionId}/reconcile`, reconciliation);
  }

  // Online Transaction Methods
  async createOnlineTransaction(transaction: OnlineTransactionCreate): Promise<OnlineTransaction> {
    const response = await apiService.post<OnlineTransactionResponse>(`${this.baseUrl}/online-transactions`, transaction);
    return response.onlineTransaction;
  }

  async getOnlineTransactions(params?: {
    skip?: number;
    limit?: number;
    platform?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OnlineTransaction[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.platform) queryParams.append('platform', params.platform);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);

    const queryString = queryParams.toString();
    const url = `${this.baseUrl}/online-transactions${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get<OnlineTransactionsResponse>(url);
    return response.onlineTransactions;
  }

  async getOnlineTransaction(transactionId: string): Promise<OnlineTransaction> {
    const response = await apiService.get<OnlineTransactionResponse>(`${this.baseUrl}/online-transactions/${transactionId}`);
    return response.onlineTransaction;
  }

  async updateOnlineTransaction(transactionId: string, transaction: OnlineTransactionUpdate): Promise<OnlineTransaction> {
    const response = await apiService.put<OnlineTransactionResponse>(`${this.baseUrl}/online-transactions/${transactionId}`, transaction);
    return response.onlineTransaction;
  }

  // Cash Position Methods
  async getLatestCashPosition(): Promise<CashPosition> {
    const response = await apiService.get<CashPositionResponse>(`${this.baseUrl}/cash-position`);
    return response.cashPosition;
  }

  async getCashPositionByDate(date: string): Promise<CashPosition> {
    const response = await apiService.get<CashPositionResponse>(`${this.baseUrl}/cash-position/${date}`);
    return response.cashPosition;
  }

  // Dashboard Methods
  async getBankingDashboard(): Promise<BankingDashboard> {
    const response = await apiService.get<BankingDashboard>(`${this.baseUrl}/dashboard`);
    return response || {
      totalBankBalance: 0,
      totalAvailableBalance: 0,
      totalPendingBalance: 0,
      totalOnlineTransactions: 0,
      pendingTransactionsCount: 0,
      dailyInflow: 0,
      dailyOutflow: 0,
      netCashFlow: 0,
      outstandingReceivables: 0,
      outstandingPayables: 0,
      recentTransactions: [],
      bankAccountsSummary: []
    };
  }

  // Reconciliation Methods
  async getReconciliationSummary(): Promise<ReconciliationSummary> {
    return await apiService.get<ReconciliationSummary>(`${this.baseUrl}/reconciliation/summary`);
  }

  // Utility Methods
  async getTransactionsByAccount(accountId: string): Promise<BankTransaction[]> {
    return this.getBankTransactions({ accountId });
  }

  async getUnreconciledTransactions(): Promise<BankTransaction[]> {
    return this.getBankTransactions({ status: TransactionStatus.PENDING });
  }

  async getTransactionsByType(transactionType: TransactionType): Promise<BankTransaction[]> {
    return this.getBankTransactions({ transactionType });
  }

  async getTransactionsByStatus(status: TransactionStatus): Promise<BankTransaction[]> {
    return this.getBankTransactions({ status });
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<BankTransaction[]> {
    return this.getBankTransactions({ startDate, endDate });
  }

  async getOnlineTransactionsByPlatform(platform: string): Promise<OnlineTransaction[]> {
    return this.getOnlineTransactions({ platform });
  }

  async getOnlineTransactionsByStatus(status: string): Promise<OnlineTransaction[]> {
    return this.getOnlineTransactions({ status });
  }
}

export const bankingService = new BankingService();
