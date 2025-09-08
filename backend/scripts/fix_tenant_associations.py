#!/usr/bin/env python3
"""
Migration script to fix tenant associations for users
This script ensures all users have proper tenant associations.
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

def fix_tenant_associations():
    """Fix tenant associations for users"""
    
    # Create database engine
    engine = create_engine(DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            
            try:
                print("🔍 Checking current tenant and user associations...")
                
                # Check if we have any tenants
                tenant_result = conn.execute(text("SELECT COUNT(*) FROM tenants"))
                tenant_count = tenant_result.fetchone()[0]
                print(f"Found {tenant_count} tenants")
                
                if tenant_count == 0:
                    print("⚠️  No tenants found! Creating a default tenant...")
                    # Create a default tenant
                    default_tenant_id = str(uuid.uuid4())
                    conn.execute(text("""
                        INSERT INTO tenants (id, name, domain, description, "isActive", "createdAt", "updatedAt")
                        VALUES (:id, :name, :domain, :description, :is_active, :created_at, :updated_at)
                    """), {
                        'id': default_tenant_id,
                        'name': 'Default Organization',
                        'domain': 'default.local',
                        'description': 'Default tenant for existing users',
                        'is_active': True,
                        'created_at': datetime.utcnow(),
                        'updated_at': datetime.utcnow()
                    })
                    print(f"✅ Created default tenant: {default_tenant_id}")
                else:
                    # Get the first available tenant
                    tenant_result = conn.execute(text("SELECT id, name FROM tenants WHERE \"isActive\" = true LIMIT 1"))
                    tenant_data = tenant_result.fetchone()
                    if tenant_data:
                        default_tenant_id = tenant_data[0]
                        tenant_name = tenant_data[1]
                        print(f"✅ Using existing tenant: {tenant_name} ({default_tenant_id})")
                    else:
                        print("❌ No active tenants found!")
                        return False
                
                # Check users without tenant associations
                users_result = conn.execute(text("""
                    SELECT COUNT(*) FROM users WHERE tenant_id IS NULL
                """))
                users_without_tenant = users_result.fetchone()[0]
                print(f"Found {users_without_tenant} users without tenant associations")
                
                if users_without_tenant > 0:
                    print("🔧 Assigning users to default tenant...")
                    conn.execute(text("""
                        UPDATE users 
                        SET tenant_id = :tenant_id, "updatedAt" = :updated_at
                        WHERE tenant_id IS NULL
                    """), {
                        'tenant_id': default_tenant_id,
                        'updated_at': datetime.utcnow()
                    })
                    print(f"✅ Assigned {users_without_tenant} users to tenant")
                
                # Create TenantUser records for all users
                print("🔧 Creating TenantUser records...")
                
                # Get all users for this tenant
                users_result = conn.execute(text("""
                    SELECT id, "userName", email FROM users WHERE tenant_id = :tenant_id
                """), {'tenant_id': default_tenant_id})
                users = users_result.fetchall()
                
                for user in users:
                    user_id, username, email = user
                    
                    # Check if TenantUser record already exists
                    existing_result = conn.execute(text("""
                        SELECT id FROM tenant_users WHERE tenant_id = :tenant_id AND "userId" = :user_id
                    """), {'tenant_id': default_tenant_id, 'user_id': user_id})
                    
                    if not existing_result.fetchone():
                        # Create TenantUser record
                        conn.execute(text("""
                            INSERT INTO tenant_users (id, tenant_id, "userId", role, permissions, "isActive", "joinedAt", "createdAt", "updatedAt")
                            VALUES (:id, :tenant_id, :user_id, :role, :permissions, :is_active, :joined_at, :created_at, :updated_at)
                        """), {
                            'id': str(uuid.uuid4()),
                            'tenant_id': default_tenant_id,
                            'user_id': user_id,
                            'role': 'owner' if email == 'admin@gmail.com' else 'member',  # Make admin user an owner
                            'permissions': '[]',
                            'is_active': True,
                            'joined_at': datetime.utcnow(),
                            'created_at': datetime.utcnow(),
                            'updated_at': datetime.utcnow()
                        })
                        print(f"  ✅ Created TenantUser record for {email}")
                
                # Create a default subscription for the tenant
                print("🔧 Creating default subscription...")
                
                # Check if subscription already exists
                sub_result = conn.execute(text("""
                    SELECT id FROM subscriptions WHERE tenant_id = :tenant_id
                """), {'tenant_id': default_tenant_id})
                
                if not sub_result.fetchone():
                    # Get a default plan
                    plan_result = conn.execute(text("SELECT id FROM plans WHERE \"isActive\" = true LIMIT 1"))
                    plan_data = plan_result.fetchone()
                    
                    if plan_data:
                        plan_id = plan_data[0]
                        
                        # Create subscription
                        conn.execute(text("""
                            INSERT INTO subscriptions (id, tenant_id, "planId", status, "isActive", "startDate", "autoRenew", "createdAt", "updatedAt")
                            VALUES (:id, :tenant_id, :plan_id, :status, :is_active, :start_date, :auto_renew, :created_at, :updated_at)
                        """), {
                            'id': str(uuid.uuid4()),
                            'tenant_id': default_tenant_id,
                            'plan_id': plan_id,
                            'status': 'active',
                            'is_active': True,
                            'start_date': datetime.utcnow(),
                            'auto_renew': True,
                            'created_at': datetime.utcnow(),
                            'updated_at': datetime.utcnow()
                        })
                        print("✅ Created default subscription")
                    else:
                        print("⚠️  No active plans found, skipping subscription creation")
                
                # Commit the transaction
                trans.commit()
                print("✅ Successfully fixed tenant associations")
                
                # Verify the results
                print("\n📊 Verification:")
                
                # Count users with tenant associations
                users_with_tenant = conn.execute(text("""
                    SELECT COUNT(*) FROM users WHERE tenant_id IS NOT NULL
                """)).fetchone()[0]
                print(f"  Users with tenant associations: {users_with_tenant}")
                
                # Count TenantUser records
                tenant_users_count = conn.execute(text("""
                    SELECT COUNT(*) FROM tenant_users WHERE "isActive" = true
                """)).fetchone()[0]
                print(f"  Active TenantUser records: {tenant_users_count}")
                
                # Count subscriptions
                subscriptions_count = conn.execute(text("""
                    SELECT COUNT(*) FROM subscriptions WHERE "isActive" = true
                """)).fetchone()[0]
                print(f"  Active subscriptions: {subscriptions_count}")
                
                return True
                
            except Exception as e:
                trans.rollback()
                print(f"❌ Error during tenant association fix: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error fixing tenant associations: {e}")
        return False

def main():
    """Main function to run the migration"""
    print("🚀 Starting migration: Fix tenant associations")
    print("=" * 60)
    
    success = fix_tenant_associations()
    
    print("=" * 60)
    if success:
        print("🎉 Migration completed successfully!")
        print("All users should now have proper tenant associations.")
        print("The 403/404 errors should be resolved.")
    else:
        print("💥 Migration failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
