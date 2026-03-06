#!/usr/bin/env python3
"""
Subscription Plans & Super Admin Seeding Script
Creates the 3 subscription tiers and a super admin user for the system
"""

import json
import uuid
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os
import sys

# Add the src directory to the path to import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from core.auth import get_password_hash

# Load environment variables from .env file in backend folder
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

def get_engine():
    """Get database engine"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    return create_engine(database_url)

def check_plans_exist(engine):
    """Check if plans already exist"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_name = 'plans';
        """))
        if result.scalar() == 0:
            return False, 0
        
        result = conn.execute(text("SELECT COUNT(*) FROM plans;"))
        return True, result.scalar()

def check_super_admin_exists(engine):
    """Check if super admin already exists"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_name = 'users';
        """))
        if result.scalar() == 0:
            return False, 0
        
        result = conn.execute(text("""
            SELECT COUNT(*) FROM users 
            WHERE "userRole" = 'super_admin' AND "tenant_id" IS NULL;
        """))
        return True, result.scalar()

def seed_super_admin(engine):
    """Create a super admin user without tenant"""
    print("👑 Starting super admin seeding...")
    
    # Check if users table exists
    table_exists, super_admin_count = check_super_admin_exists(engine)
    if not table_exists:
        print("❌ Users table does not exist. Please run table recreation script first.")
        return
    
    if super_admin_count > 0:
        print(f"⚠️  Found {super_admin_count} existing super admin(s) in database.")
        confirm = input("Do you want to continue and potentially create duplicate super admin? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("Super admin creation cancelled.")
            return
    
    try:
        with engine.connect() as conn:
            # Create super admin user
            print("📝 Creating super admin user...")
            
            # Generate UUID for the super admin
            super_admin_id = str(uuid.uuid4())
            
            # Hash the password
            password = "SuperAdmin@123"  # Default password
            hashed_password = get_password_hash(password)
            
            # Insert super admin user
            result = conn.execute(text("""
                INSERT INTO users (
                    id, "tenant_id", "userName", email, "firstName", "lastName", 
                    "hashedPassword", "userRole", "isActive", 
                    "createdAt", "updatedAt"
                ) VALUES (
                    :id, :tenant_id, :userName, :email, :firstName, :lastName,
                    :hashedPassword, :userRole, :isActive,
                    NOW(), NOW()
                ) RETURNING id;
            """), {
                "id": super_admin_id,
                "tenant_id": None,  # No tenant for super admin
                "userName": "superadmin",
                "email": "superadmin@system.com",
                "firstName": "Super",
                "lastName": "Admin",
                "hashedPassword": hashed_password,
                "userRole": "super_admin",
                "isActive": True
            })
            
            returned_id = result.scalar()
            print(f"    ✓ Super admin created with ID: {returned_id}")
            print(f"    ✓ Username: superadmin")
            print(f"    ✓ Email: superadmin@system.com")
            print(f"    ✓ Password: SuperAdmin@123")
            print(f"    ✓ Role: super_admin")
            print(f"    ✓ Tenant: None (System-wide access)")
            
            conn.commit()
            
        print(f"\n✅ Successfully created super admin!")
        print("\n🔐 Super Admin Credentials:")
        print("  • Username: superadmin")
        print("  • Email: superadmin@system.com")
        print("  • Password: SuperAdmin@123")
        print("  • Role: super_admin")
        print("  • Access: System-wide (no tenant restriction)")
        
    except SQLAlchemyError as e:
        print(f"\n❌ Error during super admin creation: {e}")
        print("Check your database configuration and table structure.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

def seed_plans(engine):
    """Seed the database with plans"""
    print("🌱 Starting plans seeding...")
    
    # Check if plans table exists
    table_exists, plan_count = check_plans_exist(engine)
    if not table_exists:
        print("❌ Plans table does not exist. Please run table recreation script first.")
        return
    
    if plan_count > 0:
        print(f"⚠️  Found {plan_count} existing plans in database.")
        confirm = input("Do you want to continue and potentially overwrite existing plans? (y/N): ").strip().lower()
        if confirm not in ['y', 'yes']:
            print("Operation cancelled.")
            return
    
    # Define the 3 plans
    plans = [
        {
            "name": "Commerce Pro",
            "description": "Complete ERP solution for retail, e-commerce, and distribution businesses",
            "planType": "commerce",
            "price": 99.99,
            "billingCycle": "monthly",
            "maxProjects": 50,
            "maxUsers": 25,
            "features": [
                "Inventory Management",
                "Point of Sale (POS)",
                "Customer Relationship Management (CRM)",
                "Sales & Invoicing",
                "Purchase Orders",
                "Warehouse Management",
                "Financial Reports",
                "Multi-location Support",
                "E-commerce Integration",
                "Barcode Scanning",
                "Customer Portal",
                "Email Marketing"
            ]
        },
        {
            "name": "Workshop Master",
            "description": "Manufacturing and production management for workshops and factories",
            "planType": "workshop",
            "price": 149.99,
            "billingCycle": "monthly",
            "maxProjects": 100,
            "maxUsers": 50,
            "features": [
                "Project Management",
                "Production Planning",
                "Work Order Management",
                "Quality Control",
                "Equipment Maintenance",
                "Inventory Management",
                "Time Tracking",
                "Resource Allocation",
                "Cost Analysis",
                "Supplier Management",
                "Workforce Management",
                "Safety Compliance"
            ]
        },
        {
            "name": "Healthcare Suite",
            "description": "Comprehensive healthcare management for clinics, hospitals, and medical practices",
            "planType": "healthcare",
            "price": 199.99,
            "billingCycle": "monthly",
            "maxProjects": 200,
            "maxUsers": 100,
            "features": [
                "Patient Management",
                "Appointment Scheduling",
                "Electronic Health Records (EHR)",
                "Billing & Insurance",
                "Inventory Management",
                "Staff Management",
                "Compliance & HIPAA",
                "Reporting & Analytics",
                "Telemedicine Support",
                "Lab Management",
                "Pharmacy Integration",
                "Medical Device Tracking"
            ]
        }
    ]
    
    try:
        with engine.connect() as conn:
            # Clear existing plans if any
            if plan_count > 0:
                print("🗑️  Clearing existing plans...")
                conn.execute(text("DELETE FROM plans;"))
                print(f"  Cleared {plan_count} existing plans")
            
            # Insert new plans
            print("📝 Inserting new plans...")
            for plan in plans:
                print(f"  Creating plan: {plan['name']}")
                
                # Generate UUID for the plan
                plan_id = str(uuid.uuid4())
                
                # Convert features list to JSON string for PostgreSQL
                features_json = json.dumps(plan['features'])
                
                # Insert plan with explicit ID
                result = conn.execute(text("""
                    INSERT INTO plans (
                        id, name, description, "planType", price, "billingCycle", 
                        "maxProjects", "maxUsers", features, "isActive", 
                        "createdAt", "updatedAt"
                    ) VALUES (
                        :id, :name, :description, :planType, :price, :billingCycle,
                        :maxProjects, :maxUsers, :features, :isActive,
                        NOW(), NOW()
                    ) RETURNING id;
                """), {
                    "id": plan_id,
                    "name": plan["name"],
                    "description": plan["description"],
                    "planType": plan["planType"],
                    "price": plan["price"],
                    "billingCycle": plan["billingCycle"],
                    "maxProjects": plan["maxProjects"],
                    "maxUsers": plan["maxUsers"],
                    "features": features_json,  # Now it's a JSON string
                    "isActive": True
                })
                
                returned_id = result.scalar()
                print(f"    ✓ Plan created with ID: {returned_id}")
            
            conn.commit()
            
        print(f"\n✅ Successfully seeded {len(plans)} plans!")
        print("\n📊 Plan Summary:")
        for plan in plans:
            print(f"  • {plan['name']} (${plan['price']}/month)")
            print(f"    Type: {plan['planType']}")
            print()
        
        print("🎯 You can now:")
        print("  1. Create tenants with these plan IDs")
        print("  2. Show different modules based on plan type")
        print("  3. Use plan.planType to determine access to features")
        
    except SQLAlchemyError as e:
        print(f"\n❌ Error during seeding: {e}")
        print("Check your database configuration and table structure.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")

def main():
    """Main function to seed subscription plans and super admin"""
    print("🌱 Subscription Plans & Super Admin Seeding Script")
    print("=" * 60)
    print("This script will create:")
    print("  1. The 3 subscription tiers")
    print("  2. A super admin user (no tenant)")
    print()
    
    try:
        engine = get_engine()
        print("✅ Connected to database successfully")
        
        # Seed plans data
        print("\n📋 Seeding Subscription Plans...")
        seed_plans(engine)
        
        # Seed super admin
        print("\n👑 Seeding Super Admin...")
        seed_super_admin(engine)
        
        print("\n🎉 Seeding completed successfully!")
        print("\n📊 Summary:")
        print("  • Subscription plans created")
        print("  • Super admin user created")
        print("\n🔐 Super Admin Login Credentials:")
        print("  • Email: superadmin@system.com")
        print("  • Password: SuperAdmin@123")
        print("  • Role: super_admin (system-wide access)")
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    main()
