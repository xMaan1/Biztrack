#!/usr/bin/env python3
"""
Script to fix invoice number constraints in the database.
This removes the global unique constraint on invoiceNumber and adds a tenant-scoped unique constraint.
Use this script on AWS server to fix the database constraints.
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

def fix_invoice_constraints():
    """Fix invoice number constraints in the database"""
    
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
        
        print("🔧 Fixing invoice number constraints...")
        
        # Check if the unique constraint exists
        check_constraint_query = text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'invoices' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name LIKE '%invoiceNumber%'
        """)
        
        result = db.execute(check_constraint_query)
        existing_constraints = result.fetchall()
        
        if existing_constraints:
            print(f"📋 Found existing constraints: {[c[0] for c in existing_constraints]}")
            
            # Drop existing unique constraints on invoiceNumber
            for constraint in existing_constraints:
                constraint_name = constraint[0]
                drop_constraint_query = text(f"""
                    ALTER TABLE invoices 
                    DROP CONSTRAINT IF EXISTS "{constraint_name}"
                """)
                db.execute(drop_constraint_query)
                print(f"🗑️  Dropped constraint: {constraint_name}")
        else:
            print("ℹ️  No existing invoice number constraints found")
        
        # Also check for the specific constraint that might exist
        specific_constraint_query = text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'invoices' 
            AND constraint_name = 'ix_invoices_invoiceNumber'
        """)
        
        result = db.execute(specific_constraint_query)
        specific_constraint = result.fetchall()
        
        if specific_constraint:
            print("🗑️  Dropping ix_invoices_invoiceNumber constraint...")
            drop_specific_query = text("""
                ALTER TABLE invoices 
                DROP CONSTRAINT IF EXISTS ix_invoices_invoiceNumber
            """)
            db.execute(drop_specific_query)
        
        # Create a new unique constraint that includes tenant_id
        create_constraint_query = text("""
            ALTER TABLE invoices 
            ADD CONSTRAINT ix_invoices_tenant_invoice_number 
            UNIQUE (tenant_id, "invoiceNumber")
        """)
        
        try:
            db.execute(create_constraint_query)
            print("✅ Created tenant-scoped unique constraint on invoiceNumber")
        except Exception as e:
            if "already exists" in str(e):
                print("ℹ️  Tenant-scoped constraint already exists, skipping creation")
            else:
                print(f"❌ Error creating constraint: {str(e)}")
                raise e
        
        # Commit the changes
        db.commit()
        print("✅ Database constraints updated successfully!")
        
        # Verify the new constraint
        verify_query = text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'invoices' 
            AND constraint_name = 'ix_invoices_tenant_invoice_number'
        """)
        
        result = db.execute(verify_query)
        if result.fetchone():
            print("✅ New constraint verified successfully!")
        else:
            print("⚠️  Warning: New constraint not found after creation")
        
        # Final verification - check all constraints
        final_check_query = text("""
            SELECT 
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'invoices'
            AND tc.constraint_type = 'UNIQUE'
            ORDER BY tc.constraint_name
        """)
        
        result = db.execute(final_check_query)
        final_constraints = result.fetchall()
        
        print("\n📊 Final constraint status:")
        for constraint in final_constraints:
            print(f"   - {constraint[0]} ({constraint[1]}) on {constraint[2]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing invoice constraints: {str(e)}")
        if 'db' in locals():
            db.rollback()
        return False
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    print("🚀 Starting invoice constraint fix for AWS deployment...")
    print("=" * 60)
    success = fix_invoice_constraints()
    if success:
        print("🎉 Invoice constraint fix completed successfully!")
        print("✅ Your AWS database is now properly configured!")
        print("✅ The 500 error should be resolved!")
        sys.exit(0)
    else:
        print("💥 Invoice constraint fix failed!")
        print("❌ Please check the error messages above")
        sys.exit(1)
