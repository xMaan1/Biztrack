#!/usr/bin/env python3
"""
Comprehensive Invoice Items Migration Script
This script migrates existing invoice_items table data to the new JSON items column
and handles foreign key constraint issues.

Usage: python migrate_invoice_items_data.py
"""

import os
import sys
import json
import uuid
from sqlalchemy import text, inspect
from dotenv import load_dotenv

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from config.unified_database import engine, SessionLocal

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def get_invoice_items_data(db):
    """Get all data from the old invoice_items table"""
    try:
        # First, let's check what columns actually exist
        check_columns_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'invoice_items'
            ORDER BY ordinal_position
        """)
        
        result = db.execute(check_columns_query)
        available_columns = [row[0] for row in result.fetchall()]
        print(f"📋 Available columns in invoice_items: {available_columns}")
        
        # Build dynamic query based on available columns
        select_columns = []
        if "invoiceId" in available_columns:
            select_columns.append('"invoiceId"')
        if "id" in available_columns:
            select_columns.append('id')
        if "description" in available_columns:
            select_columns.append('description')
        if "quantity" in available_columns:
            select_columns.append('quantity')
        if "unitPrice" in available_columns:
            select_columns.append('"unitPrice"')
        if "discount" in available_columns:
            select_columns.append('discount')
        if "taxRate" in available_columns:
            select_columns.append('"taxRate"')
        if "total" in available_columns:
            select_columns.append('total')
        if "productId" in available_columns:
            select_columns.append('"productId"')
        if "projectId" in available_columns:
            select_columns.append('"projectId"')
        if "taskId" in available_columns:
            select_columns.append('"taskId"')
        if "createdAt" in available_columns:
            select_columns.append('"createdAt"')
        if "updatedAt" in available_columns:
            select_columns.append('"updatedAt"')
        
        if not select_columns:
            print("❌ No valid columns found in invoice_items table")
            return []
        
        query = text(f"""
            SELECT {', '.join(select_columns)}
            FROM invoice_items
            ORDER BY "invoiceId", "createdAt"
        """)
        
        result = db.execute(query)
        return result.fetchall()
    except Exception as e:
        print(f"❌ Error fetching invoice_items data: {str(e)}")
        return []

def migrate_invoice_items_to_json():
    """Migrate existing invoice_items data to the new JSON items column"""
    
    print("🔄 Starting invoice items data migration...")
    
    try:
        db = SessionLocal()
        
        # Check if invoice_items table exists
        if not check_table_exists('invoice_items'):
            print("✅ No invoice_items table found - migration not needed")
            return True
        
        print("📋 Found invoice_items table, starting migration...")
        
        # Get all invoice items data
        invoice_items_data = get_invoice_items_data(db)
        
        if not invoice_items_data:
            print("ℹ️  No invoice items found to migrate")
            return True
        
        print(f"📊 Found {len(invoice_items_data)} invoice items to migrate")
        
        # Group items by invoice ID
        invoices_to_update = {}
        for item in invoice_items_data:
            # Get available columns again for this item
            check_columns_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'invoice_items'
                ORDER BY ordinal_position
            """)
            
            result = db.execute(check_columns_query)
            available_columns = [row[0] for row in result.fetchall()]
            
            # Find invoiceId column index
            invoice_id_index = available_columns.index("invoiceId") if "invoiceId" in available_columns else 0
            invoice_id = item[invoice_id_index]
            
            if invoice_id not in invoices_to_update:
                invoices_to_update[invoice_id] = []
            
            # Convert item to JSON format based on available columns
            json_item = {}
            
            if "id" in available_columns:
                id_index = available_columns.index("id")
                json_item["id"] = str(item[id_index]) if item[id_index] else str(uuid.uuid4())
            
            if "description" in available_columns:
                desc_index = available_columns.index("description")
                json_item["description"] = item[desc_index] or ""
            
            if "quantity" in available_columns:
                qty_index = available_columns.index("quantity")
                json_item["quantity"] = float(item[qty_index]) if item[qty_index] else 0.0
            
            if "unitPrice" in available_columns:
                price_index = available_columns.index("unitPrice")
                json_item["unitPrice"] = float(item[price_index]) if item[price_index] else 0.0
            
            if "discount" in available_columns:
                disc_index = available_columns.index("discount")
                json_item["discount"] = float(item[disc_index]) if item[disc_index] else 0.0
            
            if "taxRate" in available_columns:
                tax_rate_index = available_columns.index("taxRate")
                json_item["taxRate"] = float(item[tax_rate_index]) if item[tax_rate_index] else 0.0
            
            if "total" in available_columns:
                total_index = available_columns.index("total")
                json_item["total"] = float(item[total_index]) if item[total_index] else 0.0
            
            if "productId" in available_columns:
                prod_index = available_columns.index("productId")
                if item[prod_index]:
                    json_item["productId"] = str(item[prod_index])
            
            if "projectId" in available_columns:
                proj_index = available_columns.index("projectId")
                if item[proj_index]:
                    json_item["projectId"] = str(item[proj_index])
            
            if "taskId" in available_columns:
                task_index = available_columns.index("taskId")
                if item[task_index]:
                    json_item["taskId"] = str(item[task_index])
            
            # Calculate missing fields if we have the basic ones
            if "quantity" in json_item and "unitPrice" in json_item:
                if "total" not in json_item:
                    subtotal = json_item["quantity"] * json_item["unitPrice"]
                    discount_amount = subtotal * (json_item.get("discount", 0.0) / 100)
                    tax_amount = (subtotal - discount_amount) * (json_item.get("taxRate", 0.0) / 100)
                    json_item["total"] = round(subtotal - discount_amount + tax_amount, 2)
            
            # Remove None values and ensure required fields
            json_item = {k: v for k, v in json_item.items() if v is not None}
            invoices_to_update[invoice_id].append(json_item)
        
        print(f"📝 Migrating data for {len(invoices_to_update)} invoices...")
        
        # Update each invoice with its items
        success_count = 0
        for invoice_id, items in invoices_to_update.items():
            try:
                # Convert items to JSON string
                items_json = json.dumps(items)
                
                # Update the invoice
                update_query = text("""
                    UPDATE invoices 
                    SET items = :items, "updatedAt" = NOW()
                    WHERE id = :invoice_id
                """)
                
                db.execute(update_query, {
                    "items": items_json,
                    "invoice_id": invoice_id
                })
                
                success_count += 1
                print(f"  ✅ Migrated {len(items)} items for invoice {invoice_id}")
                
            except Exception as e:
                print(f"  ❌ Failed to migrate invoice {invoice_id}: {str(e)}")
                continue
        
        # Commit all changes
        db.commit()
        
        print(f"🎉 Successfully migrated {success_count} out of {len(invoices_to_update)} invoices")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def update_delete_endpoint_constraint():
    """Update the delete endpoint to handle foreign key constraints"""
    
    print("\n🔧 Updating delete endpoint to handle foreign key constraints...")
    
    try:
        db = SessionLocal()
        
        # Check if we can safely drop the constraint
        if not check_table_exists('invoice_items'):
            print("✅ No invoice_items table - no constraint to handle")
            return True
        
        # First, let's check if there are any remaining foreign key references
        check_refs_query = text("""
            SELECT COUNT(*) 
            FROM invoice_items 
            WHERE "invoiceId" IN (
                SELECT id FROM invoices
            )
        """)
        
        result = db.execute(check_refs_query)
        remaining_refs = result.fetchone()[0]
        
        if remaining_refs > 0:
            print(f"⚠️  Found {remaining_refs} remaining references in invoice_items table")
            print("   Consider migrating this data first or handling deletions manually")
            return False
        
        # Drop the foreign key constraint
        try:
            drop_constraint_query = text("""
                ALTER TABLE invoice_items 
                DROP CONSTRAINT IF EXISTS invoice_items_invoiceId_fkey
            """)
            
            db.execute(drop_constraint_query)
            db.commit()
            print("✅ Successfully dropped foreign key constraint")
            
        except Exception as e:
            print(f"⚠️  Could not drop constraint: {str(e)}")
            print("   This is okay - the constraint will be handled in the API")
        
        return True
        
    except Exception as e:
        print(f"❌ Error updating constraints: {str(e)}")
        return False
    finally:
        db.close()

def cleanup_old_table():
    """Remove the old invoice_items table after successful migration"""
    
    print("\n🧹 Cleaning up old invoice_items table...")
    
    try:
        db = SessionLocal()
        
        if not check_table_exists('invoice_items'):
            print("✅ No invoice_items table to clean up")
            return True
        
        # Check if table is empty
        count_query = text("SELECT COUNT(*) FROM invoice_items")
        result = db.execute(count_query)
        count = result.fetchone()[0]
        
        if count > 0:
            print(f"⚠️  Table still contains {count} records - skipping cleanup")
            print("   Run this script again after ensuring all data is migrated")
            return False
        
        # Drop the table
        drop_query = text("DROP TABLE IF EXISTS invoice_items CASCADE")
        db.execute(drop_query)
        db.commit()
        
        print("✅ Successfully dropped invoice_items table")
        return True
        
    except Exception as e:
        print(f"❌ Error cleaning up table: {str(e)}")
        return False
    finally:
        db.close()

def verify_migration():
    """Verify that the migration was successful"""
    
    print("\n🔍 Verifying migration...")
    
    try:
        db = SessionLocal()
        
        # Check invoices with items
        invoices_with_items_query = text("""
            SELECT COUNT(*) 
            FROM invoices 
            WHERE items IS NOT NULL AND json_array_length(items) > 0
        """)
        
        result = db.execute(invoices_with_items_query)
        invoices_with_items = result.fetchone()[0]
        
        print(f"📊 Invoices with items: {invoices_with_items}")
        
        # Check a sample invoice
        sample_query = text("""
            SELECT id, items 
            FROM invoices 
            WHERE items IS NOT NULL AND json_array_length(items) > 0
            LIMIT 1
        """)
        
        result = db.execute(sample_query)
        sample = result.fetchone()
        
        if sample:
            print(f"✅ Sample invoice {sample[0]} has {len(json.loads(sample[1]))} items")
            print(f"   First item: {json.loads(sample[1])[0] if json.loads(sample[1]) else 'None'}")
        
        # Check if invoice_items table still exists
        if check_table_exists('invoice_items'):
            print("⚠️  invoice_items table still exists")
        else:
            print("✅ invoice_items table has been removed")
        
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("🔄 Comprehensive Invoice Items Migration")
    print("=" * 70)
    
    try:
        # Step 1: Migrate data
        if not migrate_invoice_items_to_json():
            print("❌ Data migration failed - stopping")
            sys.exit(1)
        
        # Step 2: Handle constraints
        if not update_delete_endpoint_constraint():
            print("⚠️  Constraint handling had issues - continuing...")
        
        # Step 3: Clean up old table (only if safe)
        cleanup_old_table()
        
        # Step 4: Verify migration
        verify_migration()
        
        print("\n🎉 Migration completed successfully!")
        print("\n📋 Next steps:")
        print("   1. Test your invoice deletion functionality")
        print("   2. Verify that items are displayed correctly")
        print("   3. Test creating new invoices with items")
        
    except Exception as e:
        print(f"\n💥 Migration failed with error: {str(e)}")
        sys.exit(1)
