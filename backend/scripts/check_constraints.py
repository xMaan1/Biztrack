#!/usr/bin/env python3
"""
Script to check database constraints on the invoices table.
Use this script on AWS server to verify the database configuration.
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

def check_constraints():
    """Check all constraints on the invoices table"""
    
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
        
        print("🔍 Checking constraints on invoices table...")
        
        # Check all constraints
        check_constraints_query = text("""
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'invoices'
            ORDER BY tc.constraint_type, tc.constraint_name
        """)
        
        result = db.execute(check_constraints_query)
        all_constraints = result.fetchall()
        
        print(f"📋 Found {len(all_constraints)} constraints:")
        for constraint in all_constraints:
            print(f"   - {constraint[0]} ({constraint[1]}) on {constraint[2]}")
        
        # Check specifically for unique constraints
        unique_constraints_query = text("""
            SELECT 
                tc.constraint_name,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'invoices'
            AND tc.constraint_type = 'UNIQUE'
            ORDER BY tc.constraint_name
        """)
        
        result = db.execute(unique_constraints_query)
        unique_constraints = result.fetchall()
        
        print(f"\n🔒 Unique constraints ({len(unique_constraints)} found):")
        for constraint in unique_constraints:
            print(f"   - {constraint[0]} on {constraint[1]}")
        
        # Check for the old global constraint specifically
        old_constraint_query = text("""
            SELECT 
                tc.constraint_name,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'invoices'
            AND tc.constraint_type = 'UNIQUE'
            AND tc.constraint_name = 'ix_invoices_invoiceNumber'
        """)
        
        result = db.execute(old_constraint_query)
        old_constraint = result.fetchall()
        
        if old_constraint:
            print(f"\n⚠️  Found old global constraint: {old_constraint[0][0]} on {old_constraint[0][1]}")
            print("   This should be removed to fix the 500 error")
        else:
            print(f"\n✅ No old global constraint found")
        
        # Check for tenant-scoped constraint
        tenant_constraint_query = text("""
            SELECT 
                tc.constraint_name,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'invoices'
            AND tc.constraint_type = 'UNIQUE'
            AND tc.constraint_name = 'ix_invoices_tenant_invoice_number'
        """)
        
        result = db.execute(tenant_constraint_query)
        tenant_constraint = result.fetchall()
        
        if tenant_constraint:
            print(f"✅ Found tenant-scoped constraint: {tenant_constraint[0][0]} on {tenant_constraint[0][1]}")
            print("   This is the correct configuration")
        else:
            print(f"❌ Tenant-scoped constraint not found")
            print("   Run fix_invoice_constraints.py to create it")
        
        # Summary
        print(f"\n📊 SUMMARY:")
        if old_constraint:
            print("   ❌ Old global constraint exists - needs fixing")
        else:
            print("   ✅ No problematic global constraints")
        
        if tenant_constraint:
            print("   ✅ Tenant-scoped constraint exists - good configuration")
        else:
            print("   ❌ Tenant-scoped constraint missing - needs fixing")
        
        if not old_constraint and tenant_constraint:
            print("   ✅ Database is properly configured!")
        else:
            print("   ⚠️  Database needs configuration fixes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking constraints: {str(e)}")
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("🚀 Starting constraint check for AWS deployment...")
    print("=" * 60)
    success = check_constraints()
    if success:
        print("\n🎉 Constraint check completed!")
        sys.exit(0)
    else:
        print("\n💥 Constraint check failed!")
        sys.exit(1)
