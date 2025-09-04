# AWS Deployment Guide - Invoice System Fix

This guide will help you fix the invoice system on your AWS server and resolve the 500 error.

## 🚀 Quick Fix Steps

### 1. Check Current Status
```bash
python scripts/final_summary.py
```

### 2. Fix Database Constraints
```bash
python scripts/fix_invoice_constraints.py
```

### 3. Verify the Fix
```bash
python scripts/check_constraints.py
python scripts/check_invoices.py
python scripts/final_summary.py
```

## 📋 Scripts Overview

### `fix_invoice_constraints.py`
- **Purpose**: Fixes the database constraints that cause the 500 error
- **What it does**: 
  - Removes global unique constraint on `invoiceNumber`
  - Adds tenant-scoped unique constraint `(tenant_id, invoiceNumber)`
- **When to run**: When you get 500 errors on invoice creation

### `check_constraints.py`
- **Purpose**: Verifies database constraint configuration
- **What it shows**:
  - All constraints on the invoices table
  - Identifies problematic global constraints
  - Confirms tenant-scoped constraints exist
- **When to run**: After fixing constraints or to diagnose issues

### `check_invoices.py`
- **Purpose**: Checks invoice data integrity
- **What it shows**:
  - Existing invoices and their numbers
  - Duplicate invoice numbers
  - Problematic invoice numbers
  - Invoice distribution by tenant
- **When to run**: To verify data integrity

### `final_summary.py`
- **Purpose**: Complete system health check
- **What it shows**:
  - Database connection status
  - Model imports
  - API endpoints
  - Constraint configuration
  - Data integrity
  - Overall system health
- **When to run**: For complete system verification

## 🔧 Troubleshooting

### If you get "DATABASE_URL not found":
1. Ensure your environment variables are loaded
2. Check that `DATABASE_URL` is set correctly
3. Verify the database connection string format

### If constraints fail to update:
1. Check database permissions
2. Ensure you have ALTER TABLE privileges
3. Verify the database is not in read-only mode

### If the 500 error persists:
1. Run `final_summary.py` to identify specific issues
2. Check application logs for detailed error messages
3. Verify the API code changes are deployed

## ✅ Success Indicators

After running the fix scripts, you should see:
- ✅ Database connection successful
- ✅ Tenant-scoped unique constraint found
- ✅ No problematic global constraints
- ✅ No duplicate invoice numbers
- ✅ System status: HEALTHY

## 🎯 Expected Outcome

Once fixed, your invoice system will:
- Allow multiple tenants to have invoices with the same number
- Prevent duplicate invoice numbers within the same tenant
- Handle concurrent invoice creation without race conditions
- Provide proper error handling and validation
- Work reliably in production

## 📞 Support

If you encounter issues:
1. Run `final_summary.py` and note the output
2. Check the specific error messages
3. Ensure all scripts complete successfully
4. Verify the database changes were applied correctly
