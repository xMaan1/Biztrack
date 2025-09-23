#!/usr/bin/env python3
"""
Database Data Clear Script
Removes data from all tables except the plans table.
This script preserves the table structure but clears all data.
Use with caution - this will delete ALL DATA from most tables permanently!
"""

import sys
import os
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Add the src directory to the Python path
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

def get_all_tables(engine):
    """Get all table names from the database"""
    with engine.connect() as conn:
        # Get all table names
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))
        return [row[0] for row in result]

def get_table_row_counts(engine, tables):
    """Get row counts for all tables"""
    counts = {}
    with engine.connect() as conn:
        for table in tables:
            try:
                result = conn.execute(text(f'SELECT COUNT(*) FROM "{table}"'))
                count = result.scalar()
                counts[table] = count
            except Exception as e:
                counts[table] = f"Error: {e}"
    return counts

def clear_table_data(engine, table_name):
    """Clear all data from a specific table"""
    try:
        with engine.connect() as conn:
            print(f"  Clearing data from: {table_name}")
            
            # Use TRUNCATE for better performance and to reset sequences
            # CASCADE to handle any foreign key constraints
            conn.execute(text(f'TRUNCATE TABLE "{table_name}" CASCADE;'))
            conn.commit()
            
            print(f"    ✓ Table {table_name} data cleared successfully")
            return True
            
    except Exception as e:
        print(f"    ❌ Error clearing {table_name}: {e}")
        return False

def clear_all_data_except_plans(engine):
    """Clear data from all tables except plans table"""
    tables = get_all_tables(engine)
    
    if not tables:
        print("No tables found in the database.")
        return
    
    # Filter out the plans table
    tables_to_clear = [table for table in tables if table.lower() != 'plans']
    
    if not tables_to_clear:
        print("Only plans table found. No data to clear.")
        return
    
    print(f"Found {len(tables)} tables in database:")
    for table in tables:
        if table.lower() == 'plans':
            print(f"  - {table} (PLANS TABLE - WILL BE PRESERVED)")
        else:
            print(f"  - {table}")
    
    print(f"\n📊 Tables that will have data cleared: {len(tables_to_clear)}")
    print("Tables that will be preserved: plans")
    
    # Show current row counts
    print("\n📈 Current data counts:")
    counts = get_table_row_counts(engine, tables)
    for table, count in counts.items():
        if table.lower() == 'plans':
            print(f"  - {table}: {count} rows (WILL BE PRESERVED)")
        else:
            print(f"  - {table}: {count} rows")
    
    print("\n⚠️  WARNING: This will permanently delete ALL DATA from the listed tables!")
    print("⚠️  The plans table will be preserved.")
    print("⚠️  Table structures will remain intact.")
    print("⚠️  This action cannot be undone!")
    
    # Double confirmation
    confirm1 = input("\nType 'CLEAR DATA' to confirm you want to clear all data: ")
    if confirm1 != 'CLEAR DATA':
        print("Operation cancelled.")
        return
    
    confirm2 = input("Type 'YES' to confirm again: ")
    if confirm2 != 'YES':
        print("Operation cancelled.")
        return
    
    print("\n🔄 Starting data clear operation...")
    
    successful_clears = 0
    failed_clears = 0
    
    # Clear data from each table
    for table in tables_to_clear:
        if clear_table_data(engine, table):
            successful_clears += 1
        else:
            failed_clears += 1
    
    print(f"\n📊 Clear Results:")
    print(f"  ✓ Successfully cleared: {successful_clears} tables")
    if failed_clears > 0:
        print(f"  ❌ Failed to clear: {failed_clears} tables")
    
    # Show final row counts
    print("\n📈 Final data counts:")
    final_counts = get_table_row_counts(engine, tables)
    for table, count in final_counts.items():
        if table.lower() == 'plans':
            print(f"  - {table}: {count} rows (PRESERVED)")
        else:
            print(f"  - {table}: {count} rows")
    
    if successful_clears > 0:
        print("\n✅ Data clear operation completed!")
        print("Most tables have been cleared of data.")
        print("\n📝 Next steps:")
        print("  1. Your database schema is intact")
        print("  2. You can start fresh with new data")
        print("  3. Run seed scripts if needed")
        print("  4. The plans table data is preserved")
    else:
        print("\n❌ No tables were cleared. Check your database permissions.")

def main():
    """Main function"""
    print("🗑️  Database Data Clear Script")
    print("=" * 50)
    print("This script will clear data from all tables EXCEPT the plans table.")
    print("Table structures will be preserved.")
    print("=" * 50)
    
    try:
        engine = get_engine()
        print("✅ Connected to database successfully")
        
        clear_all_data_except_plans(engine)
        
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print("Please check your database configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()
