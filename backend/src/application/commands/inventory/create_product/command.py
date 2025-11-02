from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateProductCommand(ICommand):
    tenant_id: str
    name: str
    sku: str
    description: Optional[str] = None
    category: Optional[str] = None
    unit: str = "pcs"
    costPrice: float = 0.0
    sellingPrice: float = 0.0
    stockQuantity: float = 0.0
    minStockLevel: float = 0.0
    maxStockLevel: Optional[float] = None
    warehouseId: Optional[str] = None
    isActive: bool = True
    tags: List[str] = None
    created_by: str = None

