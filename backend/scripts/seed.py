#!/usr/bin/env python3
"""
Subscription Plans Seeding Script
Creates the 3 subscription tiers for the system
"""

import json
import uuid
from sqlalchemy import text, create_engine
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os

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
            ],
            "modules": ["inventory", "pos", "crm", "sales", "purchasing", "warehouse", "finance"]
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
            ],
            "modules": ["projects", "production", "inventory", "hrm", "maintenance", "quality", "finance"]
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
            ],
            "modules": ["patients", "appointments", "ehr", "billing", "inventory", "hrm", "compliance"]
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
                print(f"    ✓ Modules: {', '.join(plan['modules'])}")
            
            conn.commit()
            
        print(f"\n✅ Successfully seeded {len(plans)} plans!")
        print("\n📊 Plan Summary:")
        for plan in plans:
            print(f"  • {plan['name']} (${plan['price']}/month)")
            print(f"    Type: {plan['planType']}")
            print(f"    Modules: {', '.join(plan['modules'])}")
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
    """Main function to seed subscription plans"""
    print("🌱 Subscription Plans Seeding Script")
    print("=" * 50)
    print("This script will create the 3 subscription tiers")
    print()
    
    try:
        # Seed plans data
        print("📋 Seeding Subscription Plans...")
        engine = get_engine()
        print("✅ Connected to database successfully")
        seed_plans(engine)
        
        print("\n🎉 Plans seeding completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    main()
