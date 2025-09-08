#!/usr/bin/env python3
"""
Migration script to recreate the users table with correct schema
This script backs up existing data and recreates the table to match the SQLAlchemy model.
"""

import sys
import os
import uuid
from datetime import datetime

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config.database_config import DATABASE_URL

def recreate_users_table():
    """Recreate the users table with the correct schema"""
    
    # Create database engine
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            
            try:
                print("🔍 Checking current users table structure...")
                
                # Check if users table exists and get current data
                result = conn.execute(text("""
                    SELECT COUNT(*) FROM users
                """))
                user_count = result.fetchone()[0]
                print(f"Found {user_count} existing users")
                
                if user_count > 0:
                    print("📋 Backing up existing user data...")
                    # Backup existing data
                    backup_result = conn.execute(text("""
                        SELECT id, first_name, last_name, email, password_hash, 
                               is_active, created_at, updated_at, organization_id
                        FROM users
                    """))
                    backup_data = backup_result.fetchall()
                    print(f"✅ Backed up {len(backup_data)} users")
                
                print("🗑️  Dropping existing users table...")
                conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
                
                print("🔧 Creating new users table with correct schema...")
                conn.execute(text("""
                    CREATE TABLE users (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        tenant_id UUID REFERENCES tenants(id),
                        "userName" VARCHAR NOT NULL,
                        email VARCHAR NOT NULL UNIQUE,
                        "firstName" VARCHAR,
                        "lastName" VARCHAR,
                        "hashedPassword" VARCHAR NOT NULL,
                        "userRole" VARCHAR NOT NULL DEFAULT 'team_member',
                        avatar VARCHAR,
                        "isActive" BOOLEAN DEFAULT true,
                        "lastLogin" TIMESTAMP,
                        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                print("📊 Creating indexes...")
                conn.execute(text('CREATE INDEX idx_users_email ON users(email)'))
                conn.execute(text('CREATE INDEX idx_users_username ON users("userName")'))
                conn.execute(text('CREATE INDEX idx_users_tenant_id ON users(tenant_id)'))
                
                if user_count > 0:
                    print("📥 Restoring user data...")
                    for user_data in backup_data:
                        # Check if the tenant exists, if not set tenant_id to NULL
                        tenant_id = user_data[8]  # organization_id
                        if tenant_id:
                            tenant_check = conn.execute(text("SELECT id FROM tenants WHERE id = :tenant_id"), 
                                                       {'tenant_id': tenant_id}).fetchone()
                            if not tenant_check:
                                print(f"⚠️  Tenant {tenant_id} not found, setting tenant_id to NULL for user {user_data[3]}")
                                tenant_id = None
                        
                        conn.execute(text("""
                            INSERT INTO users (id, "userName", email, "firstName", "lastName", 
                                             "hashedPassword", "isActive", "createdAt", "updatedAt", tenant_id)
                            VALUES (:id, :username, :email, :first_name, :last_name, 
                                   :password_hash, :is_active, :created_at, :updated_at, :tenant_id)
                        """), {
                            'id': user_data[0],
                            'username': user_data[1] or 'user',  # Use first_name as username if available
                            'email': user_data[3],
                            'first_name': user_data[1],
                            'last_name': user_data[2],
                            'password_hash': user_data[4],
                            'is_active': user_data[5],
                            'created_at': user_data[6],
                            'updated_at': user_data[7],
                            'tenant_id': tenant_id
                        })
                    print(f"✅ Restored {len(backup_data)} users")
                
                # Commit the transaction
                trans.commit()
                print("✅ Successfully recreated users table")
                
                # Verify the new schema
                result = conn.execute(text("""
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    ORDER BY ordinal_position;
                """))
                
                final_columns = result.fetchall()
                print("\nNew users table schema:")
                for col_name, data_type, nullable in final_columns:
                    print(f"  {col_name} - {data_type} - nullable: {nullable}")
                
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Error during table recreation: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error recreating users table: {e}")
        return False

def main():
    """Main function to run the migration"""
    print("🚀 Starting migration: Recreate users table")
    print("=" * 60)
    print("⚠️  WARNING: This will recreate the users table!")
    print("   Existing data will be backed up and restored.")
    print("=" * 60)
    
    success = recreate_users_table()
    
    print("=" * 60)
    if success:
        print("🎉 Migration completed successfully!")
        print("The users table now matches the SQLAlchemy model definition.")
        print("The password reset functionality should work properly.")
    else:
        print("💥 Migration failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
