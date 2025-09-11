#!/usr/bin/env python3
"""
Migration script to fix CNIC unique constraint issue.
This script updates the customers table to allow NULL values for CNIC field.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from sqlalchemy import create_engine, text
from config.database_config import DATABASE_URL

def fix_cnic_constraint():
    """Fix CNIC unique constraint to allow NULL values"""
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # First, update any empty string CNIC values to NULL
            print("Updating empty CNIC values to NULL...")
            conn.execute(text("""
                UPDATE customers 
                SET cnic = NULL 
                WHERE cnic = '' OR cnic IS NULL
            """))
            conn.commit()
            
            # Drop the existing unique constraint
            print("Dropping existing CNIC unique constraint...")
            conn.execute(text("""
                ALTER TABLE customers 
                DROP CONSTRAINT IF EXISTS customers_cnic_key
            """))
            conn.commit()
            
            # Add a new unique constraint that allows NULL values
            print("Adding new CNIC unique constraint that allows NULL...")
            conn.execute(text("""
                ALTER TABLE customers 
                ADD CONSTRAINT customers_cnic_unique 
                UNIQUE (tenant_id, cnic)
            """))
            conn.commit()
            
            print("✅ CNIC constraint fix completed successfully!")
            
        except Exception as e:
            print(f"❌ Error fixing CNIC constraint: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    fix_cnic_constraint()
