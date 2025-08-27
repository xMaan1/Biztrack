#!/usr/bin/env python3
"""
Database Table Recreation Script
Recreates all database tables after they have been wiped.
This script will create the complete database schema from scratch.
"""

import sys
import os
from sqlalchemy import text, create_engine
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

def check_existing_tables(engine):
    """Check if there are existing tables"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        """))
        return result.scalar()

def recreate_tables(engine):
    """Recreate all database tables"""
    print("🔧 Starting table recreation...")
    
    # Check if tables already exist
    existing_count = check_existing_tables(engine)
    if existing_count > 0:
        print(f"⚠️  Found {existing_count} existing tables in database.")
        confirm = input("Do you want to continue and potentially overwrite existing tables? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("Operation cancelled.")
            return
    
    try:
        # Import the table creation function
        from config.database_config import create_tables
        
        print("📋 Creating all tables...")
        create_tables()
        
        # Verify tables were created
        final_count = check_existing_tables(engine)
        print(f"✅ Successfully created {final_count} tables!")
        
        # Show the new tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result]
            
            print(f"\n📊 New tables created:")
            for table in tables:
                print(f"  - {table}")
        
        print(f"\n🎉 Database schema recreation completed!")
        print("You can now:")
        print("  1. Start your backend server")
        print("  2. Create tenants from frontend")
        print("  3. Seed initial data if needed")
        
    except ImportError as e:
        print(f"❌ Error importing table creation function: {e}")
        print("Make sure your database_config.py has a create_tables() function")
    except Exception as e:
        print(f"❌ Error recreating tables: {e}")
        print("Check your database configuration and models")

def main():
    """Main function"""
    print("🔧 Database Table Recreation Script")
    print("=" * 50)
    
    try:
        engine = get_engine()
        print("✅ Connected to database successfully")
        
        recreate_tables(engine)
        
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print("Please check your database configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()
