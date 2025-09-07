#!/usr/bin/env python3
"""
Database Migration Script
Adds missing fields for admin functionality
"""

import os
import sys
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Add the src directory to the path to import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Load environment variables from .env file in backend folder
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

def get_engine():
    """Get database engine"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    return create_engine(database_url)

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = :table_name AND column_name = :column_name;
        """), {
            "table_name": table_name,
            "column_name": column_name
        })
        return result.scalar() > 0

def add_subscription_isactive_column(engine):
    """Add isActive column to subscriptions table"""
    print("🔧 Adding isActive column to subscriptions table...")
    
    # Check if column already exists
    if check_column_exists(engine, "subscriptions", "isActive"):
        print("  ✓ isActive column already exists in subscriptions table")
        return
    
    try:
        with engine.connect() as conn:
            # Add the column
            conn.execute(text("""
                ALTER TABLE subscriptions 
                ADD COLUMN "isActive" BOOLEAN DEFAULT TRUE;
            """))
            
            # Update existing records to set isActive based on status
            conn.execute(text("""
                UPDATE subscriptions 
                SET "isActive" = CASE 
                    WHEN status = 'active' THEN TRUE
                    ELSE FALSE
                END;
            """))
            
            conn.commit()
            print("  ✓ Successfully added isActive column to subscriptions table")
            
    except SQLAlchemyError as e:
        print(f"  ❌ Error adding isActive column: {e}")
        raise

def add_plan_modules_column(engine):
    """Add modules column to plans table if it doesn't exist"""
    print("🔧 Checking modules column in plans table...")
    
    # Check if column already exists
    if check_column_exists(engine, "plans", "modules"):
        print("  ✓ modules column already exists in plans table")
        return
    
    try:
        with engine.connect() as conn:
            # Add the column
            conn.execute(text("""
                ALTER TABLE plans 
                ADD COLUMN modules JSON DEFAULT '[]';
            """))
            
            conn.commit()
            print("  ✓ Successfully added modules column to plans table")
            
    except SQLAlchemyError as e:
        print(f"  ❌ Error adding modules column: {e}")
        raise

def add_user_lastlogin_column(engine):
    """Add lastLogin column to users table if it doesn't exist"""
    print("🔧 Checking lastLogin column in users table...")
    
    # Check if column already exists
    if check_column_exists(engine, "users", "lastLogin"):
        print("  ✓ lastLogin column already exists in users table")
        return
    
    try:
        with engine.connect() as conn:
            # Add the column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN "lastLogin" TIMESTAMP;
            """))
            
            conn.commit()
            print("  ✓ Successfully added lastLogin column to users table")
            
    except SQLAlchemyError as e:
        print(f"  ❌ Error adding lastLogin column: {e}")
        raise

def run_migration():
    """Run all database migrations"""
    print("🔄 Database Migration Script")
    print("=" * 50)
    print("This script will add missing fields for admin functionality")
    print()
    
    try:
        engine = get_engine()
        print("✅ Connected to database successfully")
        
        # Run migrations
        add_subscription_isactive_column(engine)
        add_plan_modules_column(engine)
        add_user_lastlogin_column(engine)
        
        print("\n✅ All migrations completed successfully!")
        print("\n📊 Summary:")
        print("  • Added isActive column to subscriptions table")
        print("  • Added modules column to plans table (if needed)")
        print("  • Added lastLogin column to users table (if needed)")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
