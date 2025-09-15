#!/usr/bin/env python3
"""
Warehouse Model Migration Script

This script adds the missing fields to the warehouses table to match the updated model.
It safely handles existing data and provides rollback capabilities.
"""

import os
import sys
import uuid
from datetime import datetime
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Load environment variables from .env file
# Try to load from backend directory first, then from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

def get_database_url():
    """Get database URL from environment or use default"""
    # Try to get from environment variables
    db_url = os.getenv('DATABASE_URL')
    
    if db_url:
        print(f"✅ Using database URL from environment: {db_url}")
        return db_url
    
    # Default to local PostgreSQL
    db_url = "postgresql://postgres:password@localhost:5432/biztrack"
    print(f"⚠️  Using default database URL: {db_url}")
    print("   Set DATABASE_URL environment variable to use a different database")
    print("   Make sure to create a .env file in the backend directory with your database configuration")
    
    return db_url

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        return any(col['name'] == column_name for col in columns)
    except Exception as e:
        print(f"❌ Error checking column {column_name}: {str(e)}")
        return False

def add_column_if_not_exists(engine, table_name, column_name, column_definition):
    """Add a column to a table if it doesn't exist"""
    try:
        if check_column_exists(engine, table_name, column_name):
            print(f"✅ Column '{column_name}' already exists in '{table_name}'")
            return True
        
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            try:
                # Add the column
                alter_sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
                conn.execute(text(alter_sql))
                trans.commit()
                print(f"✅ Added column '{column_name}' to '{table_name}'")
                return True
            except Exception as e:
                trans.rollback()
                print(f"❌ Failed to add column '{column_name}': {str(e)}")
                return False
    except Exception as e:
        print(f"❌ Error adding column '{column_name}': {str(e)}")
        return False

def rename_column_if_exists(engine, table_name, old_name, new_name, column_type):
    """Rename a column if the old name exists and new name doesn't"""
    try:
        old_exists = check_column_exists(engine, table_name, old_name)
        new_exists = check_column_exists(engine, table_name, new_name)
        
        if new_exists:
            print(f"✅ Column '{new_name}' already exists in '{table_name}'")
            return True
        
        if not old_exists:
            print(f"⚠️  Column '{old_name}' doesn't exist in '{table_name}', skipping rename")
            return True
        
        with engine.connect() as conn:
            trans = conn.begin()
            try:
                # Rename the column
                rename_sql = f"ALTER TABLE {table_name} RENAME COLUMN {old_name} TO {new_name}"
                conn.execute(text(rename_sql))
                trans.commit()
                print(f"✅ Renamed column '{old_name}' to '{new_name}' in '{table_name}'")
                return True
            except Exception as e:
                trans.rollback()
                print(f"❌ Failed to rename column '{old_name}' to '{new_name}': {str(e)}")
                return False
    except Exception as e:
        print(f"❌ Error renaming column '{old_name}' to '{new_name}': {str(e)}")
        return False

def migrate_warehouse_table():
    """Migrate the warehouses table to add missing fields"""
    print("🚀 Starting Warehouse Table Migration")
    print("=" * 50)
    
    # Get database connection
    db_url = get_database_url()
    
    try:
        engine = create_engine(db_url)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        
    except Exception as e:
        print(f"❌ Failed to connect to database: {str(e)}")
        return False
    
    # Check if warehouses table exists
    try:
        inspector = inspect(engine)
        if 'warehouses' not in inspector.get_table_names():
            print("❌ 'warehouses' table doesn't exist. Please create it first.")
            return False
        print("✅ 'warehouses' table exists")
    except Exception as e:
        print(f"❌ Error checking table existence: {str(e)}")
        return False
    
    # Define the columns to add
    columns_to_add = [
        ('description', 'TEXT'),
        ('capacity', 'FLOAT'),
        ('usedCapacity', 'FLOAT'),
        ('temperatureZone', 'VARCHAR(255)'),
        ('securityLevel', 'VARCHAR(255)'),
    ]
    
    # Define column renames
    column_renames = [
        ('manager', 'managerId', 'VARCHAR(255)'),
    ]
    
    success_count = 0
    total_operations = len(columns_to_add) + len(column_renames)
    
    print(f"\n📋 Migration Plan:")
    print(f"   • Add {len(columns_to_add)} new columns")
    print(f"   • Rename {len(column_renames)} existing columns")
    print(f"   • Total operations: {total_operations}")
    
    # Add new columns
    print(f"\n🔧 Adding new columns...")
    for column_name, column_type in columns_to_add:
        if add_column_if_not_exists(engine, 'warehouses', column_name, column_type):
            success_count += 1
    
    # Rename existing columns
    print(f"\n🔄 Renaming existing columns...")
    for old_name, new_name, column_type in column_renames:
        if rename_column_if_exists(engine, 'warehouses', old_name, new_name, column_type):
            success_count += 1
    
    # Summary
    print(f"\n📊 Migration Summary:")
    print(f"   • Successful operations: {success_count}/{total_operations}")
    
    if success_count == total_operations:
        print("✅ Migration completed successfully!")
        return True
    else:
        print("⚠️  Migration completed with some issues")
        return False

def rollback_migration():
    """Rollback the migration by removing added columns"""
    print("🔄 Starting Migration Rollback")
    print("=" * 50)
    
    db_url = get_database_url()
    
    try:
        engine = create_engine(db_url)
        
        # Columns to remove (in reverse order)
        columns_to_remove = [
            'securityLevel',
            'temperatureZone', 
            'usedCapacity',
            'capacity',
            'description',
        ]
        
        # Column renames to reverse
        column_renames = [
            ('managerId', 'manager'),
        ]
        
        success_count = 0
        total_operations = len(columns_to_remove) + len(column_renames)
        
        print(f"📋 Rollback Plan:")
        print(f"   • Remove {len(columns_to_remove)} columns")
        print(f"   • Rename {len(column_renames)} columns back")
        
        # Remove added columns
        print(f"\n🗑️  Removing added columns...")
        for column_name in columns_to_remove:
            try:
                if check_column_exists(engine, 'warehouses', column_name):
                    with engine.connect() as conn:
                        trans = conn.begin()
                        try:
                            drop_sql = f"ALTER TABLE warehouses DROP COLUMN {column_name}"
                            conn.execute(text(drop_sql))
                            trans.commit()
                            print(f"✅ Removed column '{column_name}'")
                            success_count += 1
                        except Exception as e:
                            trans.rollback()
                            print(f"❌ Failed to remove column '{column_name}': {str(e)}")
                else:
                    print(f"⚠️  Column '{column_name}' doesn't exist, skipping")
                    success_count += 1
            except Exception as e:
                print(f"❌ Error removing column '{column_name}': {str(e)}")
        
        # Rename columns back
        print(f"\n🔄 Renaming columns back...")
        for new_name, old_name in column_renames:
            if rename_column_if_exists(engine, 'warehouses', new_name, old_name, 'VARCHAR(255)'):
                success_count += 1
        
        print(f"\n📊 Rollback Summary:")
        print(f"   • Successful operations: {success_count}/{total_operations}")
        
        if success_count == total_operations:
            print("✅ Rollback completed successfully!")
            return True
        else:
            print("⚠️  Rollback completed with some issues")
            return False
            
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")
        return False

def main():
    """Main function"""
    print("🏭 Warehouse Model Migration Tool")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == 'rollback':
        success = rollback_migration()
    else:
        print("This script will add the following fields to the 'warehouses' table:")
        print("  • description (TEXT)")
        print("  • capacity (FLOAT)")
        print("  • usedCapacity (FLOAT)")
        print("  • temperatureZone (VARCHAR)")
        print("  • securityLevel (VARCHAR)")
        print("  • Rename 'manager' to 'managerId'")
        print()
        
        response = input("Do you want to proceed? (y/N): ").strip().lower()
        if response not in ['y', 'yes']:
            print("❌ Migration cancelled")
            return
        
        success = migrate_warehouse_table()
    
    if success:
        print("\n🎉 Operation completed successfully!")
        print("   Your warehouse creation should now work properly.")
    else:
        print("\n💥 Operation failed!")
        print("   Please check the error messages above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
