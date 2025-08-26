#!/usr/bin/env python3
"""
Database Migration Script: Add items column to invoices table
This script adds the items JSON column to store invoice line items.

Usage: python migrate_add_items_column.py
"""

import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from config.unified_database import engine, SessionLocal

def run_migration():
    """Run the migration to add items column to invoices table"""
    
    print("🚀 Starting database migration...")
    print("📋 Adding 'items' column to 'invoices' table...")
    
    try:
        # Create a database session
        db = SessionLocal()
        
        # Check if the column already exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'items'
        """)
        
        result = db.execute(check_query)
        column_exists = result.fetchone()
        
        if column_exists:
            print("✅ Column 'items' already exists in 'invoices' table")
            return
        
        # Add the items column
        add_column_query = text("""
            ALTER TABLE invoices 
            ADD COLUMN items JSON DEFAULT '[]'::json NOT NULL
        """)
        
        db.execute(add_column_query)
        
        # Update existing records to have an empty items array
        update_query = text("""
            UPDATE invoices 
            SET items = '[]'::json 
            WHERE items IS NULL
        """)
        
        db.execute(update_query)
        
        # Add a comment to document the column
        comment_query = text("""
            COMMENT ON COLUMN invoices.items IS 
            'JSON array containing invoice line items with id, description, quantity, unitPrice, discount, taxRate, taxAmount, total, productId, projectId, taskId'
        """)
        
        db.execute(comment_query)
        
        # Commit the changes
        db.commit()
        
        print("✅ Successfully added 'items' column to 'invoices' table")
        print("✅ Updated existing records with empty items array")
        print("✅ Added column documentation")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_migration():
    """Verify that the migration was successful"""
    
    print("\n🔍 Verifying migration...")
    
    try:
        db = SessionLocal()
        
        # Check if the column exists and has the right type
        verify_query = text("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'items'
        """)
        
        result = db.execute(verify_query)
        column_info = result.fetchone()
        
        if column_info:
            print(f"✅ Column 'items' verified:")
            print(f"   - Name: {column_info[0]}")
            print(f"   - Type: {column_info[1]}")
            print(f"   - Nullable: {column_info[2]}")
            print(f"   - Default: {column_info[3]}")
        else:
            print("❌ Column 'items' not found!")
            
        # Check if existing records have the items column
        count_query = text("SELECT COUNT(*) FROM invoices")
        result = db.execute(count_query)
        total_invoices = result.fetchone()[0]
        
        print(f"📊 Total invoices in database: {total_invoices}")
        
        if total_invoices > 0:
            # Check a sample record
            sample_query = text("SELECT id, items FROM invoices LIMIT 1")
            result = db.execute(sample_query)
            sample = result.fetchone()
            
            if sample:
                print(f"✅ Sample invoice items: {sample[1]}")
        
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🔄 Database Migration: Add items column to invoices table")
    print("=" * 60)
    
    try:
        run_migration()
        verify_migration()
        print("\n🎉 Migration completed successfully!")
        
    except Exception as e:
        print(f"\n💥 Migration failed with error: {str(e)}")
        sys.exit(1)
