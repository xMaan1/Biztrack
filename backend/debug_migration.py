#!/usr/bin/env python3
"""
Debug Migration Script
This script investigates what happened with the invoice items migration
and fixes any remaining issues.
"""

import os
import sys
import json
from sqlalchemy import text, inspect
from dotenv import load_dotenv
import uuid

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from config.unified_database import engine, SessionLocal

def debug_migration():
    """Debug what happened with the migration"""
    
    print("🔍 Debugging migration issues...")
    
    try:
        db = SessionLocal()
        
        # Check what's in the invoice_items table
        print("\n📋 Checking invoice_items table:")
        if inspect(engine).has_table('invoice_items'):
            count_query = text("SELECT COUNT(*) FROM invoice_items")
            result = db.execute(count_query)
            count = result.fetchone()[0]
            print(f"   Records in invoice_items: {count}")
            
            if count > 0:
                sample_query = text("SELECT * FROM invoice_items LIMIT 1")
                result = db.execute(sample_query)
                sample = result.fetchone()
                print(f"   Sample record: {sample}")
        else:
            print("   invoice_items table doesn't exist")
        
        # Check what's in the invoices table
        print("\n📋 Checking invoices table:")
        invoices_query = text("SELECT id, items FROM invoices WHERE items IS NOT NULL")
        result = db.execute(invoices_query)
        invoices = result.fetchall()
        
        print(f"   Invoices with items: {len(invoices)}")
        for invoice in invoices:
            print(f"   Invoice {invoice[0]}: {invoice[1]}")
            if invoice[1]:
                try:
                    items = json.loads(invoice[1]) if isinstance(invoice[1], str) else invoice[1]
                    print(f"     Items count: {len(items)}")
                    print(f"     First item: {items[0] if items else 'None'}")
                except Exception as e:
                    print(f"     Error parsing items: {e}")
        
        # Check the specific invoice that should have been migrated
        print("\n📋 Checking specific migrated invoice:")
        specific_invoice_query = text("SELECT id, items FROM invoices WHERE id = '19852d4a-86fb-43d8-b17a-736631f151a6'")
        result = db.execute(specific_invoice_query)
        invoice = result.fetchone()
        
        if invoice:
            print(f"   Invoice found: {invoice[0]}")
            print(f"   Items: {invoice[1]}")
            if invoice[1]:
                try:
                    items = json.loads(invoice[1]) if isinstance(invoice[1], str) else invoice[1]
                    print(f"     Items count: {len(items)}")
                    print(f"     Items data: {items}")
                except Exception as e:
                    print(f"     Error parsing items: {e}")
        else:
            print("   Invoice not found!")
        
        # Try to manually migrate the remaining data
        print("\n🔄 Attempting manual migration fix:")
        if inspect(engine).has_table('invoice_items'):
            # Get the remaining invoice item
            remaining_query = text("SELECT * FROM invoice_items LIMIT 1")
            result = db.execute(remaining_query)
            item = result.fetchone()
            
            if item:
                print(f"   Found remaining item: {item}")
                
                # Get column names
                columns_query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'invoice_items'
                    ORDER BY ordinal_position
                """)
                result = db.execute(columns_query)
                columns = [row[0] for row in result.fetchall()]
                print(f"   Columns: {columns}")
                
                # Find invoiceId index
                invoice_id_index = columns.index("invoiceId")
                invoice_id = item[invoice_id_index]
                print(f"   Invoice ID: {invoice_id}")
                
                # Create JSON item
                json_item = {}
                if "id" in columns:
                    id_index = columns.index("id")
                    json_item["id"] = str(item[id_index]) if item[id_index] else str(uuid.uuid4())
                if "description" in columns:
                    desc_index = columns.index("description")
                    json_item["description"] = item[desc_index] or ""
                if "quantity" in columns:
                    qty_index = columns.index("quantity")
                    json_item["quantity"] = float(item[qty_index]) if item[qty_index] else 0.0
                if "unitPrice" in columns:
                    price_index = columns.index("unitPrice")
                    json_item["unitPrice"] = float(item[price_index]) if item[price_index] else 0.0
                if "discount" in columns:
                    disc_index = columns.index("discount")
                    json_item["discount"] = float(item[disc_index]) if item[disc_index] else 0.0
                if "taxRate" in columns:
                    tax_rate_index = columns.index("taxRate")
                    json_item["taxRate"] = float(item[tax_rate_index]) if item[tax_rate_index] else 0.0
                
                # Calculate total
                if "quantity" in json_item and "unitPrice" in json_item:
                    subtotal = json_item["quantity"] * json_item["unitPrice"]
                    discount_amount = subtotal * (json_item.get("discount", 0.0) / 100)
                    tax_amount = (subtotal - discount_amount) * (json_item.get("taxRate", 0.0) / 100)
                    json_item["total"] = round(subtotal - discount_amount + tax_amount, 2)
                
                print(f"   JSON item: {json_item}")
                
                # Update the invoice
                update_query = text("""
                    UPDATE invoices 
                    SET items = :items, "updatedAt" = NOW()
                    WHERE id = :invoice_id
                """)
                
                db.execute(update_query, {
                    "items": json.dumps([json_item]),
                    "invoice_id": invoice_id
                })
                
                db.commit()
                print("   ✅ Invoice updated successfully")
                
                # Now delete the invoice item
                delete_query = text("DELETE FROM invoice_items WHERE id = :item_id")
                db.execute(delete_query, {"item_id": item[0]})
                db.commit()
                print("   ✅ Invoice item deleted")
        
        # Final verification
        print("\n🔍 Final verification:")
        final_query = text("SELECT id, items FROM invoices WHERE items IS NOT NULL AND json_array_length(items) > 0")
        result = db.execute(final_query)
        final_invoices = result.fetchall()
        
        print(f"   Invoices with items: {len(final_invoices)}")
        for invoice in final_invoices:
            try:
                items = json.loads(invoice[1]) if isinstance(invoice[1], str) else invoice[1]
                print(f"   Invoice {invoice[0]}: {len(items)} items")
            except Exception as e:
                print(f"   Invoice {invoice[0]}: Error parsing items - {e}")
        
        # Check if invoice_items table is empty
        if inspect(engine).has_table('invoice_items'):
            count_query = text("SELECT COUNT(*) FROM invoice_items")
            result = db.execute(count_query)
            count = result.fetchone()[0]
            print(f"   Remaining records in invoice_items: {count}")
            
            if count == 0:
                print("   🧹 Cleaning up empty invoice_items table...")
                drop_query = text("DROP TABLE IF EXISTS invoice_items CASCADE")
                db.execute(drop_query)
                db.commit()
                print("   ✅ invoice_items table dropped")
        
    except Exception as e:
        print(f"❌ Debug failed: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🔍 Debug Migration Issues")
    print("=" * 60)
    
    debug_migration()
    print("\n🎯 Debug completed!")
