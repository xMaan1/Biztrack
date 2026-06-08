from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from ...http_common import tenant_id_str
from .schemas import MotRetailer, MotRetailerCreate, MotRetailerUpdate, MotRetailersResponse
from . import logic

router = APIRouter()


@router.get("/mot-retailers", response_model=MotRetailersResponse)
async def list_mot_retailers(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value)),
):
    return logic.list_mot_retailers(tenant_id_str(tenant_context), db)


@router.get("/mot-retailers/{retailer_id}", response_model=MotRetailer)
async def get_mot_retailer(
    retailer_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value)),
):
    return logic.get_mot_retailer(tenant_id_str(tenant_context), retailer_id, db)


@router.post("/mot-retailers", response_model=MotRetailer, status_code=status.HTTP_201_CREATED)
async def create_mot_retailer(
    body: MotRetailerCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_CREATE.value)),
):
    return logic.create_mot_retailer(tenant_id_str(tenant_context), body, db)


@router.put("/mot-retailers/{retailer_id}", response_model=MotRetailer)
async def update_mot_retailer(
    retailer_id: str,
    body: MotRetailerUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_UPDATE.value)),
):
    return logic.update_mot_retailer(tenant_id_str(tenant_context), retailer_id, body, db)


@router.post("/mot-retailers/{retailer_id}/set-default", response_model=MotRetailer)
async def set_default_mot_retailer(
    retailer_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_UPDATE.value)),
):
    return logic.set_default_mot_retailer(tenant_id_str(tenant_context), retailer_id, db)


@router.delete("/mot-retailers/{retailer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mot_retailer(
    retailer_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_DELETE.value)),
):
    logic.delete_mot_retailer(tenant_id_str(tenant_context), retailer_id, db)
