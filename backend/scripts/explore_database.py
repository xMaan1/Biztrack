#!/usr/bin/env python3
"""
Database Explorer Script
Shows all table names and allows you to view data from any table.
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
        # Get all table names with row counts
        result = conn.execute(text("""
            SELECT 
                table_name,
                (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))
        return [(row[0], row[1]) for row in result]

def get_table_info(engine, table_name):
    """Get table structure information"""
    with engine.connect() as conn:
        # Get column information
        result = conn.execute(text("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = :table_name
            ORDER BY ordinal_position;
        """), {"table_name": table_name})
        
        columns = []
        for row in result:
            columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2],
                "default": row[3]
            })
        
        # Get row count
        count_result = conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
        row_count = count_result.scalar()
        
        return columns, row_count

def view_table_data(engine, table_name, limit=10):
    """View data from a specific table"""
    try:
        with engine.connect() as conn:
            # Get sample data
            result = conn.execute(text(f'SELECT * FROM "{table_name}" LIMIT {limit}'))
            
            # Get column names
            columns = result.keys()
            
            # Get data
            rows = result.fetchall()
            
            print(f"\n📊 Table: {table_name}")
            print(f"📈 Showing up to {limit} rows:")
            print("-" * 80)
            
            if not rows:
                print("No data found in this table.")
                return
            
            # Print column headers
            header = " | ".join(f"{col:15}" for col in columns)
            print(header)
            print("-" * len(header))
            
            # Print data rows
            for row in rows:
                formatted_row = " | ".join(f"{str(val):15}"[:15] for val in row)
                print(formatted_row)
                
            print(f"\nTotal rows in table: {len(rows)}")
            
    except Exception as e:
        print(f"❌ Error viewing table data: {e}")

def main():
    """Main function"""
    print("🔍 Database Explorer Script")
    print("=" * 50)
    
    try:
        engine = get_engine()
        print("✅ Connected to database successfully")
        
        while True:
            print("\n" + "=" * 50)
            tables = get_all_tables(engine)
            
            if not tables:
                print("No tables found in the database.")
                break
            
            print(f"📋 Found {len(tables)} tables:")
            print()
            
            for i, (table_name, column_count) in enumerate(tables, 1):
                print(f"{i:2}. {table_name:25} ({column_count} columns)")
            
            print(f"{0:2}. Exit")
            
            try:
                choice = input(f"\nEnter table number (0-{len(tables)}): ").strip()
                
                if choice == "0":
                    print("👋 Goodbye!")
                    break
                
                choice_num = int(choice)
                if 1 <= choice_num <= len(tables):
                    selected_table = tables[choice_num - 1][0]
                    
                    # Show table info
                    columns, row_count = get_table_info(engine, selected_table)
                    print(f"\n📋 Table: {selected_table}")
                    print(f"📊 Columns: {len(columns)}, Rows: {row_count}")
                    
                    # Show column structure
                    print("\n🏗️  Table Structure:")
                    print(f"{'Column Name':<20} {'Type':<15} {'Nullable':<10} {'Default'}")
                    print("-" * 60)
                    for col in columns:
                        nullable = "YES" if col["nullable"] == "YES" else "NO"
                        default = str(col["default"]) if col["default"] else "NULL"
                        print(f"{col['name']:<20} {col['type']:<15} {nullable:<10} {default}")
                    
                    # Ask if user wants to see data
                    view_data = input(f"\nView data from {selected_table}? (y/n): ").strip().lower()
                    if view_data in ['y', 'yes']:
                        try:
                            limit = int(input("How many rows to show? (default 10): ") or "10")
                        except ValueError:
                            limit = 10
                        
                        view_table_data(engine, selected_table, limit)
                    
                    input("\nPress Enter to continue...")
                    
                else:
                    print("❌ Invalid choice. Please enter a number between 0 and", len(tables))
                    
            except ValueError:
                print("❌ Please enter a valid number.")
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                input("Press Enter to continue...")
        
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print("Please check your database configuration.")
        sys.exit(1)

if __name__ == "__main__":
    main()
