"""
Inventory Synchronization Service

This service handles the synchronization between invoices and inventory management.
When an invoice is marked as paid, it automatically deducts the corresponding stock
from the inventory system.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..config.database import get_db
from ..config.invoice_models import Invoice
from ..config.inventory_models import Product, StockMovement
from ..config.inventory_crud import get_product_by_id, create_stock_movement
from ..models.unified_models import StockMovementCreate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InventorySyncService:
    """Service for synchronizing invoice payments with inventory deductions"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def sync_invoice_with_inventory(self, invoice_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """
        Synchronize invoice payment with inventory deduction
        
        Args:
            invoice_id: The ID of the paid invoice
            tenant_id: The tenant ID
            user_id: The user ID who triggered the sync
            
        Returns:
            Dict containing sync results and any errors
        """
        try:
            # Get the invoice
            invoice = self.db.query(Invoice).filter(
                and_(
                    Invoice.id == invoice_id,
                    Invoice.tenant_id == tenant_id
                )
            ).first()
            
            if not invoice:
                error_msg = f"Invoice {invoice_id} not found"
                logger.error(error_msg)
                return {"success": False, "error": error_msg}
            
            # Validate invoice has items
            if not invoice.items or len(invoice.items) == 0:
                error_msg = f"Invoice {invoice_id} has no items to sync"
                logger.warning(error_msg)
                return {"success": False, "error": error_msg}
            
            # Process each item in the invoice
            sync_results = []
            total_items_deducted = 0
            errors = []
            
            for item in invoice.items:
                try:
                    result = self._deduct_item_stock(
                        item=item,
                        invoice_id=invoice_id,
                        tenant_id=tenant_id,
                        user_id=user_id
                    )
                    
                    if result["success"]:
                        sync_results.append(result)
                        total_items_deducted += result["quantity_deducted"]
                        logger.info(f"Successfully deducted {result['quantity_deducted']} units of product {result['product_id']}")
                    else:
                        errors.append(result["error"])
                        logger.error(f"Failed to deduct stock for product {item.get('productId', 'unknown')}: {result['error']}")
                        
                except Exception as e:
                    error_msg = f"Error processing item {item.get('productId', 'unknown')}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg)
            
            # Determine overall success
            success = len(errors) == 0
            
            result = {
                "success": success,
                "invoice_id": invoice_id,
                "total_items_deducted": total_items_deducted,
                "items_processed": len(invoice.items),
                "sync_results": sync_results,
                "errors": errors
            }
            
            if success:
                logger.info(f"Successfully synced invoice {invoice_id} with inventory. Deducted {total_items_deducted} total items.")
            else:
                logger.warning(f"Partial sync completed for invoice {invoice_id}. {len(errors)} errors occurred.")
            
            return result
            
        except Exception as e:
            error_msg = f"Failed to sync invoice {invoice_id} with inventory: {str(e)}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}
    
    def _deduct_item_stock(self, item: Dict[str, Any], invoice_id: str, tenant_id: str, user_id: str) -> Dict[str, Any]:
        """
        Deduct stock for a single invoice item
        
        Args:
            item: Invoice item data
            invoice_id: The invoice ID
            tenant_id: The tenant ID
            user_id: The user ID
            
        Returns:
            Dict containing the result of the stock deduction
        """
        try:
            product_id = item.get("productId")
            quantity = item.get("quantity", 0)
            unit_price = item.get("unitPrice", 0)
            
            # Validate item data
            if not product_id:
                return {"success": False, "error": "Product ID is required"}
            
            if quantity <= 0:
                return {"success": False, "error": f"Invalid quantity: {quantity}. Must be greater than 0"}
            
            # Get the product
            product = get_product_by_id(product_id, self.db, tenant_id)
            if not product:
                return {"success": False, "error": f"Product {product_id} not found"}
            
            # Check if product is active
            if not product.isActive:
                return {"success": False, "error": f"Product {product.name} is not active"}
            
            # Check stock availability
            if product.stockQuantity < quantity:
                return {
                    "success": False, 
                    "error": f"Insufficient stock for product {product.name}. Available: {product.stockQuantity}, Required: {quantity}"
                }
            
            # Deduct stock from product
            old_stock = product.stockQuantity
            product.stockQuantity -= quantity
            product.updatedAt = datetime.utcnow()
            
            # Create stock movement record
            stock_movement_data = {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "productId": product_id,
                "warehouseId": product.warehouseId or "default",  # Use default warehouse if not specified
                "movementType": "outbound",
                "quantity": quantity,
                "unitCost": product.costPrice,
                "referenceNumber": invoice_id,
                "referenceType": "Invoice",
                "notes": f"Stock deduction for invoice {invoice_id}",
                "status": "completed",
                "createdBy": user_id,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            # Create stock movement
            stock_movement = StockMovement(**stock_movement_data)
            self.db.add(stock_movement)
            
            # Commit the changes
            self.db.commit()
            
            return {
                "success": True,
                "product_id": product_id,
                "product_name": product.name,
                "quantity_deducted": quantity,
                "old_stock": old_stock,
                "new_stock": product.stockQuantity,
                "stock_movement_id": str(stock_movement.id)
            }
            
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"Failed to deduct stock: {str(e)}"}
    
    def validate_invoice_items(self, invoice_id: str, tenant_id: str) -> Dict[str, Any]:
        """
        Validate that all invoice items can be deducted from inventory
        
        Args:
            invoice_id: The invoice ID
            tenant_id: The tenant ID
            
        Returns:
            Dict containing validation results
        """
        try:
            # Get the invoice
            invoice = self.db.query(Invoice).filter(
                and_(
                    Invoice.id == invoice_id,
                    Invoice.tenant_id == tenant_id
                )
            ).first()
            
            if not invoice:
                return {"valid": False, "error": f"Invoice {invoice_id} not found"}
            
            if not invoice.items or len(invoice.items) == 0:
                return {"valid": False, "error": "Invoice has no items"}
            
            validation_results = []
            all_valid = True
            
            for item in invoice.items:
                product_id = item.get("productId")
                quantity = item.get("quantity", 0)
                
                if not product_id:
                    validation_results.append({
                        "product_id": "unknown",
                        "valid": False,
                        "error": "Product ID is required"
                    })
                    all_valid = False
                    continue
                
                if quantity <= 0:
                    validation_results.append({
                        "product_id": product_id,
                        "valid": False,
                        "error": f"Invalid quantity: {quantity}"
                    })
                    all_valid = False
                    continue
                
                # Get the product
                product = get_product_by_id(product_id, self.db, tenant_id)
                if not product:
                    validation_results.append({
                        "product_id": product_id,
                        "valid": False,
                        "error": "Product not found"
                    })
                    all_valid = False
                    continue
                
                if not product.isActive:
                    validation_results.append({
                        "product_id": product_id,
                        "product_name": product.name,
                        "valid": False,
                        "error": "Product is not active"
                    })
                    all_valid = False
                    continue
                
                if product.stockQuantity < quantity:
                    validation_results.append({
                        "product_id": product_id,
                        "product_name": product.name,
                        "valid": False,
                        "error": f"Insufficient stock. Available: {product.stockQuantity}, Required: {quantity}"
                    })
                    all_valid = False
                    continue
                
                validation_results.append({
                    "product_id": product_id,
                    "product_name": product.name,
                    "valid": True,
                    "available_stock": product.stockQuantity,
                    "required_quantity": quantity
                })
            
            return {
                "valid": all_valid,
                "invoice_id": invoice_id,
                "validation_results": validation_results
            }
            
        except Exception as e:
            return {"valid": False, "error": f"Validation failed: {str(e)}"}

# Import uuid at the top level
import uuid
