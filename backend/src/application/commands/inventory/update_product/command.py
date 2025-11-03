from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateProductCommand(ICommand):
    product_id: str
    tenant_id: str
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    costPrice: Optional[float] = None
    sellingPrice: Optional[float] = None
    stockQuantity: Optional[float] = None
    minStockLevel: Optional[float] = None
    maxStockLevel: Optional[float] = None
    warehouseId: Optional[str] = None
    isActive: Optional[bool] = None
    tags: Optional[List[str]] = None

