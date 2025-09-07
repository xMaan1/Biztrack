from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import Optional, List
from datetime import datetime

from ...models.unified_models import Tenant, TenantCreate
from ...config.database import get_db
from ...api.dependencies import get_current_user
from ...config.core_models import Tenant as TenantModel, User, Subscription, Plan, TenantUser

router = APIRouter(prefix="/admin", tags=["admin"])

def is_super_admin(current_user) -> bool:
    """Check if current user is super admin"""
    return current_user.userRole == "super_admin"

@router.get("/tenants", response_model=List[dict])
async def get_all_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all tenants - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        # Build query
        query = db.query(TenantModel)
        
        # Apply filters
        if search:
            query = query.filter(
                TenantModel.name.ilike(f"%{search}%") |
                TenantModel.domain.ilike(f"%{search}%") |
                TenantModel.description.ilike(f"%{search}%")
            )
        
        if is_active is not None:
            query = query.filter(TenantModel.isActive == is_active)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        tenants = query.offset(skip).limit(limit).all()
        
        # Build response with additional data
        tenant_data = []
        for tenant in tenants:
            # Get subscription info
            subscription = db.query(Subscription).filter(
                Subscription.tenant_id == tenant.id,
                Subscription.isActive == True
            ).first()
            
            # Get user count from TenantUser table
            user_count = db.query(TenantUser).filter(
                TenantUser.tenant_id == tenant.id,
                TenantUser.isActive == True
            ).count()
            
            # Get plan info
            plan_info = None
            if subscription:
                plan = db.query(Plan).filter(Plan.id == subscription.planId).first()
                if plan:
                    plan_info = {
                        "id": str(plan.id),
                        "name": plan.name,
                        "planType": plan.planType,
                        "price": plan.price,
                        "billingCycle": plan.billingCycle
                    }
            
            tenant_data.append({
                "id": str(tenant.id),
                "name": tenant.name,
                "domain": tenant.domain,
                "description": tenant.description,
                "isActive": tenant.isActive,
                "createdAt": tenant.createdAt,
                "updatedAt": tenant.updatedAt,
                "settings": tenant.settings,
                "userCount": user_count,
                "subscription": {
                    "id": str(subscription.id) if subscription else None,
                    "isActive": subscription.isActive if subscription else False,
                    "startDate": subscription.startDate if subscription else None,
                    "endDate": subscription.endDate if subscription else None,
                    "plan": plan_info
                } if subscription else None
            })
        
        return tenant_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tenants: {str(e)}"
        )

@router.get("/tenants/{tenant_id}", response_model=dict)
async def get_tenant_details(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed information about a specific tenant - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        # Get tenant
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Get subscription info
        subscription = db.query(Subscription).filter(
            Subscription.tenant_id == tenant.id
        ).first()
        
        # Get plan info
        plan_info = None
        if subscription:
            plan = db.query(Plan).filter(Plan.id == subscription.planId).first()
            if plan:
                plan_info = {
                    "id": str(plan.id),
                    "name": plan.name,
                    "description": plan.description,
                    "planType": plan.planType,
                    "price": plan.price,
                    "billingCycle": plan.billingCycle,
                    "maxProjects": plan.maxProjects,
                    "maxUsers": plan.maxUsers,
                    "features": plan.features,
                    "modules": plan.modules if hasattr(plan, 'modules') else []
                }
        
        # Get users from TenantUser table
        tenant_users = db.query(TenantUser).filter(
            TenantUser.tenant_id == tenant.id
        ).all()
        
        user_data = []
        for tenant_user in tenant_users:
            # Get the actual user details
            user = db.query(User).filter(User.id == tenant_user.userId).first()
            if user:
                user_data.append({
                    "id": str(user.id),
                    "userName": user.userName,
                    "email": user.email,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "userRole": user.userRole,
                    "isActive": user.isActive,
                    "createdAt": user.createdAt,
                    "lastLogin": user.lastLogin,
                    "tenantRole": tenant_user.role,
                    "tenantPermissions": tenant_user.permissions
                })
        
        # Get statistics
        stats = {
            "totalUsers": len(user_data),
            "activeUsers": len([u for u in user_data if u["isActive"]]),
            "totalProjects": 0,  # Would need to query projects table
            "totalCustomers": 0,  # Would need to query customers table
            "totalInvoices": 0,  # Would need to query invoices table
            "storageUsed": 0,  # Would need to calculate from file storage
            "lastActivity": tenant.updatedAt
        }
        
        return {
            "tenant": {
                "id": str(tenant.id),
                "name": tenant.name,
                "domain": tenant.domain,
                "description": tenant.description,
                "isActive": tenant.isActive,
                "createdAt": tenant.createdAt,
                "updatedAt": tenant.updatedAt,
                "settings": tenant.settings
            },
            "subscription": {
                "id": str(subscription.id) if subscription else None,
                "isActive": subscription.isActive if subscription else False,
                "startDate": subscription.startDate if subscription else None,
                "endDate": subscription.endDate if subscription else None,
                "plan": plan_info
            } if subscription else None,
            "users": user_data,
            "statistics": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching tenant details: {str(e)}"
        )

@router.put("/tenants/{tenant_id}/status")
async def update_tenant_status(
    tenant_id: str,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Activate/Deactivate a tenant - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        tenant.isActive = is_active
        tenant.updatedAt = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": f"Tenant {'activated' if is_active else 'deactivated'} successfully",
            "tenant": {
                "id": str(tenant.id),
                "name": tenant.name,
                "isActive": tenant.isActive
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating tenant status: {str(e)}"
        )

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get system-wide statistics - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        # Get tenant statistics
        total_tenants = db.query(TenantModel).count()
        active_tenants = db.query(TenantModel).filter(TenantModel.isActive == True).count()
        
        # Get user statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.isActive == True).count()
        super_admins = db.query(User).filter(User.userRole == "super_admin").count()
        
        # Get tenant-assigned users (from TenantUser table)
        tenant_assigned_users = db.query(TenantUser).filter(TenantUser.isActive == True).count()
        active_tenant_users = db.query(TenantUser).filter(TenantUser.isActive == True).count()
        
        # Get subscription statistics
        total_subscriptions = db.query(Subscription).count()
        active_subscriptions = db.query(Subscription).filter(Subscription.isActive == True).count()
        
        # Get plan distribution
        plan_stats = db.query(
            Plan.name,
            Plan.planType,
            func.count(Subscription.id).label('count')
        ).join(Subscription, Plan.id == Subscription.planId).group_by(
            Plan.name, Plan.planType
        ).all()
        
        plan_distribution = [
            {
                "planName": stat.name,
                "planType": stat.planType,
                "count": stat.count
            }
            for stat in plan_stats
        ]
        
        return {
            "tenants": {
                "total": total_tenants,
                "active": active_tenants,
                "inactive": total_tenants - active_tenants
            },
            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": total_users - active_users,
                "superAdmins": super_admins,
                "tenantAssigned": tenant_assigned_users,
                "systemUsers": total_users - tenant_assigned_users
            },
            "subscriptions": {
                "total": total_subscriptions,
                "active": active_subscriptions,
                "inactive": total_subscriptions - active_subscriptions
            },
            "planDistribution": plan_distribution
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin stats: {str(e)}"
        )
