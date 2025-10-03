#!/usr/bin/env python3

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def create_indexes():
    """Create database indexes for performance optimization"""
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("Error: DATABASE_URL not found in environment variables")
        return False
    
    engine = create_engine(DATABASE_URL)
    
    indexes = [
        # Project indexes
        "CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id)",
        "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)",
        "CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority)",
        "CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(\"createdAt\")",
        "CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(\"projectManagerId\")",
        "CREATE INDEX IF NOT EXISTS idx_projects_tenant_status ON projects(tenant_id, status)",
        
        # Work Order indexes
        "CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(work_order_type)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_is_active ON work_orders(is_active)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to_id)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status ON work_orders(tenant_id, status)",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_active ON work_orders(tenant_id, is_active)",
        
        # Invoice indexes
        "CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(\"createdAt\")",
        "CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(\"dueDate\")",
        "CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(\"customerId\")",
        "CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status)",
        "CREATE INDEX IF NOT EXISTS idx_invoices_tenant_due_date ON invoices(tenant_id, \"dueDate\")",
    ]
    
    try:
        with engine.connect() as conn:
            for index_sql in indexes:
                try:
                    conn.execute(text(index_sql))
                    print(f"✓ Created index: {index_sql}")
                except Exception as e:
                    print(f"✗ Failed to create index: {index_sql}")
                    print(f"  Error: {e}")
            
            conn.commit()
            print("\n✅ All indexes created successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
        return False

if __name__ == "__main__":
    print("Creating database indexes for performance optimization...")
    success = create_indexes()
    sys.exit(0 if success else 1)
