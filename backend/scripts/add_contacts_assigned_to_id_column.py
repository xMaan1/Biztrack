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
                ALTER TABLE contacts
                ADD COLUMN IF NOT EXISTS "assignedToId" UUID REFERENCES users(id);
            """))
            conn.commit()
            print('Successfully added contacts."assignedToId" column')
            return True
    except Exception as e:
        print(f"Error running migration: {str(e)}")
        return False
    finally:
        engine.dispose()


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
