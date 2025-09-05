#!/usr/bin/env python3
"""
Migration script to add invoice customization table to the database.
This script will create the invoice_customizations table if it doesn't exist.
"""

import sys
import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from config.database_config import engine, Base
from config.invoice_customization_models import InvoiceCustomization

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Run the migration to create invoice customization table"""
    try:
        logger.info("🚀 Starting invoice customization migration...")
        
        # Create the invoice_customizations table
        logger.info("📋 Creating invoice_customizations table...")
        InvoiceCustomization.__table__.create(engine, checkfirst=True)
        
        logger.info("✅ Invoice customization migration completed successfully!")
        logger.info("📊 Table 'invoice_customizations' is ready for use")
        
        # Verify the table was created
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_name = 'invoice_customizations'
            """))
            
            if result.fetchone():
                logger.info("✅ Verification: invoice_customizations table exists")
            else:
                logger.error("❌ Verification failed: invoice_customizations table not found")
                return False
                
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"❌ Database error during migration: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during migration: {str(e)}")
        return False

def rollback_migration():
    """Rollback the migration by dropping the table"""
    try:
        logger.info("🔄 Rolling back invoice customization migration...")
        
        with engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS invoice_customizations CASCADE"))
            conn.commit()
            
        logger.info("✅ Rollback completed successfully!")
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"❌ Database error during rollback: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during rollback: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Invoice Customization Migration Script")
    parser.add_argument("--rollback", action="store_true", help="Rollback the migration")
    parser.add_argument("--verify", action="store_true", help="Verify the migration")
    
    args = parser.parse_args()
    
    if args.rollback:
        success = rollback_migration()
    elif args.verify:
        try:
            with engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT table_name, column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'invoice_customizations'
                    ORDER BY ordinal_position
                """))
                
                columns = result.fetchall()
                if columns:
                    logger.info("✅ Invoice customizations table exists with columns:")
                    for col in columns:
                        logger.info(f"   - {col[1]} ({col[2]})")
                else:
                    logger.info("❌ Invoice customizations table does not exist")
            success = True
        except Exception as e:
            logger.error(f"❌ Verification error: {str(e)}")
            success = False
    else:
        success = run_migration()
    
    sys.exit(0 if success else 1)
