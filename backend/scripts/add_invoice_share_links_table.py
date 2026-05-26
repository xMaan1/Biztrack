#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)


def run_migration():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in environment variables")
        return False

    engine = create_engine(database_url)

    try:
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS invoice_share_links (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    code VARCHAR(16) NOT NULL UNIQUE,
                    invoice_id UUID NOT NULL REFERENCES invoices(id),
                    tenant_id UUID NOT NULL REFERENCES tenants(id),
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'utc')
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_invoice_share_links_invoice_tenant
                ON invoice_share_links (invoice_id, tenant_id);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_invoice_share_links_code
                ON invoice_share_links (code);
            """))
            conn.commit()
            print("Successfully created invoice_share_links table and indexes")
            return True
    except Exception as e:
        print(f"Error running migration: {str(e)}")
        return False
    finally:
        engine.dispose()


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
