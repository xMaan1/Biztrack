#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)


def run_migration():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment variables")
        return False

    engine = create_engine(DATABASE_URL)

    try:
        with engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE customers ADD COLUMN IF NOT EXISTS image_url TEXT;
            """))
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS customer_guarantors (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id),
                    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    mobile VARCHAR(50),
                    cnic VARCHAR(50),
                    residential_address TEXT,
                    official_address TEXT,
                    occupation VARCHAR(255),
                    relation VARCHAR(100),
                    display_order INTEGER DEFAULT 0,
                    "createdAt" TIMESTAMP DEFAULT (now() AT TIME ZONE 'utc'),
                    "updatedAt" TIMESTAMP DEFAULT (now() AT TIME ZONE 'utc')
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_customer_guarantors_tenant_id ON customer_guarantors (tenant_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_customer_guarantors_customer_id ON customer_guarantors (customer_id);
            """))
            conn.commit()
            print("Successfully added image_url to customers and customer_guarantors table")
            return True
    except Exception as e:
        print(f"Error running migration: {str(e)}")
        return False
    finally:
        engine.dispose()


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
