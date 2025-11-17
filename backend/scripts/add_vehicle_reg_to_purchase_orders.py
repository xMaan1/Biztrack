#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def add_vehicle_reg_column():
    """Add vehicleReg column to purchase_orders table"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment variables")
        return False
    
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE purchase_orders 
                ADD COLUMN IF NOT EXISTS "vehicleReg" VARCHAR(255) NULL;
            """))
            conn.commit()
            print("Successfully added vehicleReg column to purchase_orders table")
            return True
    except Exception as e:
        print(f"Error adding vehicleReg column: {str(e)}")
        return False
    finally:
        engine.dispose()

if __name__ == "__main__":
    success = add_vehicle_reg_column()
    sys.exit(0 if success else 1)

