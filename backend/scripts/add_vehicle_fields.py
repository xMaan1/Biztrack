#!/usr/bin/env python3
"""
Add Vehicle Fields to Invoices Table
Adds vehicle details and workshop-specific fields to existing invoices table
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

def check_column_exists(engine, table_name, column_name):
    """Check if a column exists in a table"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = :table_name 
            AND column_name = :column_name;
        """), {"table_name": table_name, "column_name": column_name})
        return result.scalar() > 0

def add_vehicle_fields(engine):
    """Add vehicle fields to invoices table"""
    print("🔧 Adding vehicle fields to invoices table...")
    
    # Define the new columns to add
    new_columns = [
        ("vehicleMake", "VARCHAR"),
        ("vehicleModel", "VARCHAR"),
        ("vehicleYear", "VARCHAR"),
        ("vehicleColor", "VARCHAR"),
        ("vehicleVin", "VARCHAR"),
        ("vehicleReg", "VARCHAR"),
        ("vehicleMileage", "VARCHAR"),
        ("jobDescription", "TEXT"),
        ("partsDescription", "TEXT"),
        ("labourTotal", "FLOAT DEFAULT 0.0"),
        ("partsTotal", "FLOAT DEFAULT 0.0")
    ]
    
    try:
        with engine.connect() as conn:
            for column_name, column_type in new_columns:
                if not check_column_exists(engine, "invoices", column_name):
                    print(f"  Adding column: {column_name}")
                    conn.execute(text(f"""
                        ALTER TABLE invoices 
                        ADD COLUMN "{column_name}" {column_type};
                    """))
                    print(f"    ✓ Added {column_name}")
                else:
                    print(f"  Column {column_name} already exists, skipping")
            
            conn.commit()
            
        print("\n✅ Successfully added vehicle fields to invoices table!")
        print("\n📋 Added columns:")
        for column_name, column_type in new_columns:
            print(f"  • {column_name} ({column_type})")
        
    except SQLAlchemyError as e:
        print(f"\n❌ Error adding vehicle fields: {e}")
        print("Check your database configuration and permissions.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

def main():
    """Main function to add vehicle fields"""
    print("🔧 Add Vehicle Fields to Invoices Table")
    print("=" * 50)
    print("This script will add vehicle details and workshop-specific fields")
    print("to the existing invoices table.")
    print()
    
    try:
        # Add vehicle fields
        print("📋 Adding Vehicle Fields...")
        engine = get_engine()
        print("✅ Connected to database successfully")
        add_vehicle_fields(engine)
        
        print("\n🎉 Vehicle fields addition completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Operation failed: {str(e)}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    main()
