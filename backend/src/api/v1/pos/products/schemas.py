from pydantic import BaseModel
from typing import Optional

from .....models.inventory_models import ProductCategory


class ProductFilters(BaseModel):
    category: Optional[str] = None
    search: Optional[str] = None
    lowStock: Optional[bool] = None
    isActive: Optional[bool] = None


class CategoryCreate(BaseModel):
    name: str


def default_category_values():
    return [e.value for e in ProductCategory]
