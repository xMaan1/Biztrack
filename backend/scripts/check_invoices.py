#!/usr/bin/env python3
"""
Script to check existing invoices and their numbers.
Use this script on AWS server to verify invoice data integrity.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Load environment variables
load_dotenv()

def check_invoices():
    """Check existing invoices"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        print("Please ensure DATABASE_URL is set in your environment")
        return False
    
    try:
        # Create database engine
        engine = create_engine(database_url)
        
        # Test connection
        try:
            engine.connect()
            print("✅ Database connection successful")
        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")
            return False
        
        # Create a session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("🔍 Checking existing invoices...")
        
        # Check all invoices
        check_invoices_query = text("""
            SELECT 
                id,
                "invoiceNumber",
                tenant_id,
                "customerName",
                status,
                total,
                "createdAt"
            FROM invoices
            ORDER BY "createdAt" DESC
            LIMIT 10
        """)
        
        result = db.execute(check_invoices_query)
        invoices = result.fetchall()
        
        print(f"📋 Found {len(invoices)} invoices:")
        for invoice in invoices:
            print(f"   - {invoice[1]} ({invoice[4]}) - {invoice[3]} - ${invoice[5]} - {invoice[6]}")
        
        # Check for specific invoice number that was causing issues
        specific_query = text("""
            SELECT 
                id,
                "invoiceNumber",
                tenant_id,
                "customerName",
                status
            FROM invoices
            WHERE "invoiceNumber" = 'INV-202509-0001'
        """)
        
        result = db.execute(specific_query)
        specific_invoices = result.fetchall()
        
        if specific_invoices:
            print(f"\n⚠️  Found {len(specific_invoices)} invoices with number 'INV-202509-0001':")
            for invoice in specific_invoices:
                print(f"   - {invoice[0]} - Tenant: {invoice[2]} - Customer: {invoice[3]} - Status: {invoice[4]}")
        else:
            print(f"\n✅ No invoices found with number 'INV-202509-0001'")
        
        # Check for duplicate invoice numbers
        duplicate_query = text("""
            SELECT 
                "invoiceNumber",
                COUNT(*) as count
            FROM invoices
            GROUP BY "invoiceNumber"
            HAVING COUNT(*) > 1
        """)
        
        result = db.execute(duplicate_query)
        duplicates = result.fetchall()
        
        if duplicates:
            print(f"\n⚠️  Found {len(duplicates)} duplicate invoice numbers:")
            for duplicate in duplicates:
                print(f"   - {duplicate[0]}: {duplicate[1]} occurrences")
        else:
            print(f"\n✅ No duplicate invoice numbers found")
        
        # Check invoice numbers by tenant
        tenant_invoices_query = text("""
            SELECT 
                tenant_id,
                COUNT(*) as invoice_count,
                MIN("invoiceNumber") as first_invoice,
                MAX("invoiceNumber") as last_invoice
            FROM invoices
            GROUP BY tenant_id
            ORDER BY invoice_count DESC
        """)
        
        result = db.execute(tenant_invoices_query)
        tenant_invoices = result.fetchall()
        
        print(f"\n📊 Invoices by tenant:")
        for tenant_data in tenant_invoices:
            print(f"   - Tenant {tenant_data[0]}: {tenant_data[1]} invoices")
            print(f"     Range: {tenant_data[2]} to {tenant_data[3]}")
        
        # Summary
        print(f"\n📊 SUMMARY:")
        print(f"   Total invoices: {len(invoices)}")
        print(f"   Duplicate numbers: {len(duplicates)}")
        print(f"   Tenants with invoices: {len(tenant_invoices)}")
        
        if len(duplicates) == 0:
            print("   ✅ Data integrity: Good")
        else:
            print("   ⚠️  Data integrity: Has duplicates")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking invoices: {str(e)}")
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("🚀 Starting invoice check for AWS deployment...")
    print("=" * 60)
    success = check_invoices()
    if success:
        print("\n🎉 Invoice check completed!")
        sys.exit(0)
    else:
        print("\n💥 Invoice check failed!")
        sys.exit(1)
