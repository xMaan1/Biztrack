
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import uuid
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tenants", tags=["tenants"])

from ...config.database import (
    get_db, get_plans, get_plan_by_id, create_tenant, 
    create_subscription, create_tenant_user, get_user_tenants,
    get_tenant_by_id, get_tenant_users, get_subscription_by_tenant,
    get_permissions, create_permission, get_custom_roles, create_custom_role, update_custom_role, delete_custom_role
)
from ...models.unified_models import (
    Plan, PlansResponse, TenantCreate, Tenant, SubscriptionCreate,
    TenantUserCreate, TenantRole, SubscriptionStatus, TenantUsersResponse,
    SubscribeRequest, CustomRole, CustomRoleCreate, CustomRoleUpdate, Permission, UsersResponse
)

# Import the ledger seeding function from services
from ...services.ledger_seeding import create_default_chart_of_accounts

from ...api.dependencies import get_current_user, require_super_admin, require_tenant_admin_or_super_admin
from ...services.rbac_service import RBACService

@router.get("/plans", response_model=PlansResponse)
async def get_available_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans (public endpoint)"""
    plans = get_plans(db)
    return PlansResponse(plans=plans)

@router.get("/plans/admin", response_model=PlansResponse, dependencies=[Depends(require_super_admin)])
async def get_available_plans_admin(db: Session = Depends(get_db)):
    """Get all available subscription plans (admin only)"""
    plans = get_plans(db)
    return PlansResponse(plans=plans)

@router.post("/subscribe", dependencies=[Depends(require_super_admin)])
async def subscribe_to_plan(
    req: SubscribeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Subscribe to a plan and create a new tenant"""
    plan_id = req.planId
    tenant_name = req.tenantName
    domain = req.domain
    # Verify plan exists
    plan = get_plan_by_id(plan_id, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Create tenant
    tenant_data = {
        "name": tenant_name,
        "domain": f"{tenant_name.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}",
        "description": f"{tenant_name} workspace",
        "settings": {}
    }
    
    tenant = create_tenant(tenant_data, db)
    
    # Create subscription (trial for now)
    subscription_data = {
        "tenant_id": tenant.id,
        "planId": plan.id,
        "status": SubscriptionStatus.TRIAL.value,
        "startDate": datetime.utcnow(),
        "endDate": datetime.utcnow() + timedelta(days=14),  # 14-day trial
        "autoRenew": True
    }
    
    subscription = create_subscription(subscription_data, db)
    
    # Add user as owner with new RBAC system
    # First create default roles for the tenant
    default_roles = RBACService.create_default_roles(db, str(tenant.id))
    
    # Find the owner role
    owner_role = next((role for role in default_roles if role.name == "owner"), None)
    if not owner_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create owner role"
        )
    
    # Create tenant user with owner role
    tenant_user_data = {
        "tenant_id": tenant.id,
        "userId": current_user.id,
        "role_id": str(owner_role.id),
        "role": owner_role.name,
        "custom_permissions": [],
        "isActive": True
    }
    
    tenant_user = create_tenant_user(tenant_user_data, db)

    # Automatically seed the ledger for the new tenant
    try:
        create_default_chart_of_accounts(
            tenant_id=str(tenant.id), 
            created_by=str(current_user.id),
            db=db
        )
        logger.info(f"✅ Ledger seeded successfully for tenant: {tenant.name}")
    except Exception as e:
        logger.warning(f"⚠️ Warning: Ledger seeding failed for tenant {tenant.name}: {str(e)}")
        # Don't fail the tenant creation, but log the warning
    
    return {
        "success": True,
        "message": "Successfully subscribed to plan",
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "domain": tenant.domain
        },
        "subscription": {
            "id": str(subscription.id),
            "status": subscription.status,
            "trial_ends": subscription.endDate
        }
    }

@router.post("/create-tenant", dependencies=[Depends(get_current_user)])
async def create_tenant_from_landing(
    req: SubscribeRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tenant from landing page subscription"""
    plan_id = req.planId
    tenant_name = req.tenantName
    domain = req.domain
    
    # Verify plan exists
    plan = get_plan_by_id(plan_id, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Check if user already has a tenant with this name
    existing_tenants = get_user_tenants(current_user.id, db)
    for tenant in existing_tenants:
        if tenant.name.lower() == tenant_name.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a tenant with this name"
            )
    
    # Create tenant
    tenant_data = {
        "name": tenant_name,
        "domain": f"{tenant_name.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}",
        "description": f"{tenant_name} workspace",
        "settings": {
            "plan_type": plan.planType,
            "features": plan.features or [],
            "max_projects": plan.maxProjects,
            "max_users": plan.maxUsers
        }
    }
    
    tenant = create_tenant(tenant_data, db)
    
    # Create subscription (trial for now)
    subscription_data = {
        "tenant_id": tenant.id,
        "planId": plan.id,
        "status": SubscriptionStatus.TRIAL.value,
        "startDate": datetime.utcnow(),
        "endDate": datetime.utcnow() + timedelta(days=14),  # 14-day trial
        "autoRenew": True
    }
    
    subscription = create_subscription(subscription_data, db)
    
    # Add user as owner with new RBAC system
    # First create default roles for the tenant
    default_roles = RBACService.create_default_roles(db, str(tenant.id))
    
    # Find the owner role
    owner_role = next((role for role in default_roles if role.name == "owner"), None)
    if not owner_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create owner role"
        )
    
    # Create tenant user with owner role
    tenant_user_data = {
        "tenant_id": tenant.id,
        "userId": current_user.id,
        "role_id": str(owner_role.id),
        "role": owner_role.name,
        "custom_permissions": [],
        "isActive": True
    }
    
    tenant_user = create_tenant_user(tenant_user_data, db)

    # Automatically seed the ledger for the new tenant
    try:
        create_default_chart_of_accounts(
            tenant_id=str(tenant.id), 
            created_by=str(current_user.id),
            db=db
        )
        logger.info(f"✅ Ledger seeded successfully for tenant: {tenant.name}")
    except Exception as e:
        logger.warning(f"⚠️ Warning: Ledger seeding failed for tenant {tenant.name}: {str(e)}")
        # Don't fail the tenant creation, but log the warning
    
    return {
        "success": True,
        "message": "Tenant created successfully! Welcome to BizTrack",
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "domain": tenant.domain,
            "plan_type": plan.planType,
            "features": plan.features or []
        },
        "subscription": {
            "id": str(subscription.id),
            "status": subscription.status,
            "trial_ends": subscription.endDate,
            "plan_name": plan.name
        }
    }

@router.get("/my-tenants")
async def get_my_tenants(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tenants for the current user"""
    tenant_users = get_user_tenants(str(current_user.id), db)
    
    tenants = []
    for tenant_user in tenant_users:
        tenant = get_tenant_by_id(str(tenant_user.tenant_id), db)
        if tenant:
            tenants.append({
                "id": str(tenant.id),
                "name": tenant.name,
                "domain": tenant.domain,
                "role": tenant_user.role,
                "joined_at": tenant_user.joinedAt
            })
    
    return {"tenants": tenants}

@router.get("/{tenant_id}")
async def get_tenant(
    tenant_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tenant details"""
    tenant = get_tenant_by_id(tenant_id, db)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if user has access to this tenant
    tenant_users = get_user_tenants(str(current_user.id), db)
    user_tenant = next((tu for tu in tenant_users if str(tu.tenant_id) == tenant_id), None)
    
    if not user_tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tenant"
        )
    
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "domain": tenant.domain,
        "description": tenant.description,
        "settings": tenant.settings,
        "user_role": user_tenant.role,
        "created_at": tenant.createdAt
    }

@router.get("/{tenant_id}/users", response_model=UsersResponse)
async def get_tenant_users_list(
    tenant_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users in a tenant, with their tenant role info"""
    # Verify user has access to tenant
    user_tenants = get_user_tenants(str(current_user.id), db)
    user_tenant = next((tu for tu in user_tenants if str(tu.tenant_id) == tenant_id), None)
    if not user_tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tenant"
        )
    tenant_users = get_tenant_users(tenant_id, db)
    from ...config.database import User as DBUser
    user_ids = [tu.userId for tu in tenant_users]
    users = db.query(DBUser).filter(DBUser.id.in_(user_ids)).all() if user_ids else []
    user_id_to_role = {str(tu.userId): tu.role for tu in tenant_users}
    user_dicts = []
    for user in users:
        user_dict = {
            "userId": str(user.id),
            "userName": user.userName,
            "email": user.email,
            "firstName": user.firstName,
            "lastName": user.lastName,
            "userRole": user.userRole,  # global role only
            "tenantRole": user_id_to_role.get(str(user.id)),  # per-tenant role
            "avatar": user.avatar,
            "isActive": user.isActive,
            "permissions": []
        }
        user_dicts.append(user_dict)
    return {"users": user_dicts}

@router.get("/current/subscription")
async def get_tenant_subscription(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current tenant's subscription information"""
    try:
        # Get user's current tenant
        tenant_users = get_user_tenants(current_user.id, db)
        if not tenant_users:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not associated with any tenant"
            )
        
        # Get the first active tenant (you might want to handle multiple tenants differently)
        tenant_user = next((tu for tu in tenant_users if tu.isActive), None)
        if not tenant_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active tenant found"
            )
        
        tenant_id = str(tenant_user.tenant_id)
        
        # Get subscription for this tenant
        subscription = get_subscription_by_tenant(tenant_id, db)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found for tenant"
            )
        
        # Get plan details
        plan = subscription.plan
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Plan information not found"
            )
        
        return {
            "success": True,
            "subscription": {
                "id": str(subscription.id),
                "status": subscription.status,
                "startDate": subscription.startDate,
                "endDate": subscription.endDate,
                "plan": {
                    "id": str(plan.id),
                    "name": plan.name,
                    "planType": plan.planType,
                    "price": plan.price,
                    "billingCycle": plan.billingCycle,
                    "maxProjects": plan.maxProjects,
                    "maxUsers": plan.maxUsers,
                    "features": plan.features
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tenant subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription information"
        )