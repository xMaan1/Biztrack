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
                CREATE TABLE IF NOT EXISTS pos_product_categories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id),
                    name VARCHAR(255) NOT NULL,
                    "createdAt" TIMESTAMP DEFAULT (now() AT TIME ZONE 'utc')
                );
            """))
            conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS ix_pos_product_categories_tenant_name
                ON pos_product_categories (tenant_id, name);
            """))
            conn.commit()
            print("Successfully created pos_product_categories table and index")
            return True
    except Exception as e:
        print(f"Error running migration: {str(e)}")
        return False
    finally:
        engine.dispose()


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
