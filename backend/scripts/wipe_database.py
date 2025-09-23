#!/usr/bin/env python3
"""
Database Wipe Script
Completely removes ALL tables from the database.
Use with extreme caution - this will delete ALL tables and data permanently!
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

def drop_all_tables(engine):
    """Drop all tables from the database"""
    tables = get_all_tables(engine)
    
    if not tables:
        print("No tables found in the database.")
        return
    
    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table}")
    
    print("\n⚠️  WARNING: This will permanently delete ALL TABLES and ALL DATA!")
    print("This action cannot be undone!")
    print("You will need to recreate your database schema after this!")
    
    # Double confirmation
    confirm1 = input("\nType 'DROP ALL' to confirm you want to delete all tables: ")
    if confirm1 != 'DROP ALL':
        print("Operation cancelled.")
        return
    
    confirm2 = input("Type 'YES' to confirm again: ")
    if confirm2 != 'YES':
        print("Operation cancelled.")
        return
    
    print("\n🔄 Starting complete database wipe...")
    
    successful_drops = 0
    failed_drops = 0
    
    # Drop each table in its own transaction to avoid cascading failures
    for table in tables:
        try:
            # Create a new connection for each table drop
            with engine.connect() as conn:
                print(f"  Dropping table: {table}")
                conn.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE;'))
                conn.commit()
                print(f"    ✓ Table {table} dropped successfully")
                successful_drops += 1
                
        except Exception as e:
            print(f"    ❌ Error dropping {table}: {e}")
            failed_drops += 1
    
    print(f"\n📊 Drop Results:")
    print(f"  ✓ Successfully dropped: {successful_drops} tables")
    if failed_drops > 0:
        print(f"  ❌ Failed to drop: {failed_drops} tables")
    
    if successful_drops > 0:
        print("\n✅ Database wipe completed!")
        print("Most tables have been dropped.")
        print("\n📝 Next steps:")
        print("  1. Run your database migrations to recreate tables")
        print("  2. Or run your table creation scripts")
        print("  3. Seed fresh data if needed")
    else:
        print("\n❌ No tables were dropped. Check your database permissions.")

def main():
    """Main function"""
    print("🗑️  Complete Database Wipe Script")
    print("=" * 50)
    
    try:
        engine = get_engine()
        print("✅ Connected to database successfully")
        
        drop_all_tables(engine)
        
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print("Please check your database configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()
