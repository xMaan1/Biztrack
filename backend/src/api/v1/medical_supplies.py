from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from ...models.healthcare import (
    MedicalSupplyCreate, MedicalSupplyUpdate, MedicalSupplyResponse, MedicalSupplyStatsResponse
)
from ...config.database import get_db
from ...config.medical_supply_crud import (
    create_medical_supply, get_medical_supply_by_id, get_medical_supplies, update_medical_supply, delete_medical_supply, get_medical_supply_stats
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.unified_models import ModulePermission

class MedicalSuppliesResponse(BaseModel):
    supplies: List[MedicalSupplyResponse]
    total: int

router = APIRouter(prefix="/medical-supplies", tags=["medical-supplies"])

@router.post("", response_model=MedicalSupplyResponse)
async def create_medical_supply_endpoint(
    supply_data: MedicalSupplyCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.INVENTORY_CREATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    try:
        supply = create_medical_supply(db, supply_data.dict(), tenant_context["tenant_id"])
        return MedicalSupplyResponse.model_validate(supply)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create medical supply: {str(e)}")

@router.get("", response_model=MedicalSuppliesResponse)
async def get_medical_supplies_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    low_stock: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.INVENTORY_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    supplies, total = get_medical_supplies(
        db, 
        tenant_context["tenant_id"], 
        skip, 
        limit, 
        search, 
        category, 
        low_stock
    )
    return MedicalSuppliesResponse(
        supplies=[MedicalSupplyResponse.from_attributes(supply) for supply in supplies],
        total=total
    )

@router.get("/stats", response_model=MedicalSupplyStatsResponse)
async def get_medical_supply_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.INVENTORY_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_medical_supply_stats(db, tenant_context["tenant_id"])
    return MedicalSupplyStatsResponse(**stats)

@router.get("/{supply_id}", response_model=MedicalSupplyResponse)
async def get_medical_supply_endpoint(
    supply_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.INVENTORY_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    supply = get_medical_supply_by_id(db, supply_id, tenant_context["tenant_id"])
    if not supply:
        raise HTTPException(status_code=404, detail="Medical supply not found")
    return MedicalSupplyResponse.from_attributes(supply)

@router.put("/{supply_id}", response_model=MedicalSupplyResponse)
async def update_medical_supply_endpoint(
    supply_id: str,
    supply_data: MedicalSupplyUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.INVENTORY_UPDATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    supply = update_medical_supply(db, supply_id, supply_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not supply:
        raise HTTPException(status_code=404, detail="Medical supply not found")
    return MedicalSupplyResponse.from_attributes(supply)

@router.delete("/{supply_id}")
async def delete_medical_supply_endpoint(
    supply_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.INVENTORY_DELETE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_medical_supply(db, supply_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Medical supply not found")
    return {"message": "Medical supply deleted successfully"}

