from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from ...models.unified_models import Tenant, TenantCreate
from ...config.database import get_db
from ...presentation.dependencies.auth import get_current_user
from ...config.core_models import Tenant as TenantModel, User, Subscription, Plan, TenantUser

router = APIRouter(prefix="/admin", tags=["admin"])

class TenantStatusUpdate(BaseModel):
    is_active: bool

class TenantDeleteRequest(BaseModel):
    deleteAllData: bool = False

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
                Subscription.tenant_id == tenant.id
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
                "status": subscription.status if subscription else None,
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
                "status": subscription.status if subscription else None,
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
    status_data: TenantStatusUpdate,
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
        
        tenant.isActive = status_data.is_active
        tenant.updatedAt = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": f"Tenant {'activated' if status_data.is_active else 'deactivated'} successfully",
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

@router.delete("/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    delete_request: TenantDeleteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a tenant and optionally all its data - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        # Verify tenant exists
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        tenant_name = tenant.name
        
        if delete_request.deleteAllData:
            # SIMPLE BULLETPROOF APPROACH: Only delete tables that definitely exist
            try:
                # Get user IDs for this tenant
                tenant_users = db.query(TenantUser).filter(TenantUser.tenant_id == tenant_id).all()
                user_ids = [str(tu.userId) for tu in tenant_users]
                
                # Delete tenant-user relationships FIRST
                db.execute(text("DELETE FROM tenant_users WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                db.commit()  # Commit after each major step
                
                # Delete only the core tables we know exist
                core_tables = [
                    "payments", "invoices", "projects", "customers", "leads", 
                    "work_orders", "work_order_tasks", "maintenance_schedules", 
                    "equipment", "production_plans", "chart_of_accounts", 
                    "journal_entries", "ledger_transactions", "financial_periods", 
                    "budgets", "quality_checks", "audit_logs"
                ]
                
                for table in core_tables:
                    try:
                        db.execute(text(f"DELETE FROM {table} WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                        db.commit()  # Commit after each table
                    except Exception as e:
                        print(f"Warning: Could not delete from {table}: {e}")
                        db.rollback()  # Rollback on error
                        continue
                
                # Delete users that don't belong to other tenants
                for user_id in user_ids:
                    try:
                        other_tenants_count = db.execute(
                            text("SELECT COUNT(*) FROM tenant_users WHERE \"userId\" = :user_id"), 
                            {"user_id": user_id}
                        ).scalar()
                        
                        if other_tenants_count == 0:
                            # Delete user-related data that references users
                            user_ref_tables = [
                                "chart_of_accounts", "journal_entries", "ledger_transactions",
                                "work_order_tasks", "quality_checks", "financial_periods", "budgets"
                            ]
                            
                            for table in user_ref_tables:
                                try:
                                    db.execute(text(f"DELETE FROM {table} WHERE created_by = :user_id"), {"user_id": user_id})
                                except Exception as e:
                                    print(f"Warning: Could not delete user references from {table}: {e}")
                            
                            # Finally delete the user
                            db.execute(text("DELETE FROM users WHERE id = :user_id"), {"user_id": user_id})
                            db.commit()
                    except Exception as e:
                        print(f"Warning: Could not delete user {user_id}: {e}")
                        db.rollback()
                        continue
                
                # Delete subscription
                try:
                    db.execute(text("DELETE FROM subscriptions WHERE tenant_id = :tenant_id"), {"tenant_id": tenant_id})
                    db.commit()
                except Exception as e:
                    print(f"Warning: Could not delete subscription: {e}")
                    db.rollback()
                
            except Exception as e:
                print(f"Error during tenant data deletion: {e}")
                db.rollback()
                # Continue anyway - we'll still delete the tenant
        
        # Delete the tenant itself
        db.query(TenantModel).filter(TenantModel.id == tenant_id).delete()
        db.commit()
        
        return {
            "success": True,
            "message": f"Tenant '{tenant_name}' {'and all its data' if delete_request.deleteAllData else ''} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting tenant: {str(e)}"
        )

@router.get("/tenants/{tenant_id}/complete")
async def get_tenant_complete_details(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get complete tenant details with all related data - Super Admin only"""
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
                    "tenantUserActive": tenant_user.isActive
                })
        
        # Get invoices count and details
        from ...config.invoice_models import Invoice
        invoices = db.query(Invoice).filter(Invoice.tenant_id == tenant.id).all()
        invoice_data = []
        for invoice in invoices:
            invoice_data.append({
                "id": str(invoice.id),
                "invoiceNumber": invoice.invoiceNumber,
                "customerName": invoice.customerName,
                "customerEmail": invoice.customerEmail,
                "total": invoice.total,
                "status": invoice.status,
                "issueDate": invoice.issueDate,
                "dueDate": invoice.dueDate,
                "createdAt": invoice.createdAt
            })
        
        # Get projects count and details
        from ...config.project_models import Project
        projects = db.query(Project).filter(Project.tenant_id == tenant.id).all()
        project_data = []
        for project in projects:
            project_data.append({
                "id": str(project.id),
                "name": project.name,
                "description": project.description,
                "status": project.status,
                "startDate": project.startDate,
                "endDate": project.endDate,
                "createdAt": project.createdAt
            })
        
        # Get customers count and details
        from ...config.crm_models import Customer
        customers = db.query(Customer).filter(Customer.tenant_id == tenant.id).all()
        customer_data = []
        for customer in customers:
            customer_data.append({
                "id": str(customer.id),
                "customerId": customer.customerId,
                "name": f"{customer.firstName} {customer.lastName}",
                "email": customer.email,
                "phone": customer.phone,
                "mobile": customer.mobile,
                "customerType": customer.customerType,
                "customerStatus": customer.customerStatus,
                "createdAt": customer.createdAt
            })
        
        # Calculate statistics
        total_users = len(user_data)
        active_users = len([u for u in user_data if u["isActive"]])
        total_projects = len(project_data)
        total_customers = len(customer_data)
        total_invoices = len(invoice_data)
        
        # Calculate total invoice value
        total_invoice_value = sum(invoice["total"] for invoice in invoice_data)
        
        # Get last activity (most recent update across all entities)
        last_activities = []
        if user_data:
            last_activities.extend([u["lastLogin"] for u in user_data if u["lastLogin"]])
        if invoice_data:
            last_activities.extend([i["createdAt"] for i in invoice_data])
        if project_data:
            last_activities.extend([p["createdAt"] for p in project_data])
        if customer_data:
            last_activities.extend([c["createdAt"] for c in customer_data])
        
        last_activity = max(last_activities) if last_activities else tenant.createdAt
        
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
                "status": subscription.status if subscription else None,
                "startDate": subscription.startDate if subscription else None,
                "endDate": subscription.endDate if subscription else None,
                "plan": plan_info
            } if subscription else None,
            "users": user_data,
            "invoices": invoice_data,
            "projects": project_data,
            "customers": customer_data,
            "statistics": {
                "totalUsers": total_users,
                "activeUsers": active_users,
                "totalProjects": total_projects,
                "totalCustomers": total_customers,
                "totalInvoices": total_invoices,
                "totalInvoiceValue": total_invoice_value,
                "lastActivity": last_activity
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching complete tenant details: {str(e)}"
        )

@router.get("/tenants/{tenant_id}/invoices/{invoice_id}")
async def get_tenant_invoice_details(
    tenant_id: str,
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed information about a specific invoice for a tenant - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        # Verify tenant exists
        tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found"
            )
        
        # Get invoice details
        from ...config.invoice_models import Invoice
        invoice = db.query(Invoice).filter(
            and_(
                Invoice.id == invoice_id,
                Invoice.tenant_id == tenant.id
            )
        ).first()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # Convert invoice to response format
        from ...models.unified_models import InvoiceResponse
        try:
            return InvoiceResponse(invoice=invoice)
        except Exception as validation_error:
            print(f"Validation error in InvoiceResponse: {validation_error}")
            print(f"Invoice items: {invoice.items}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create invoice response: {str(validation_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching invoice details: {str(e)}"
        )

@router.delete("/tenants/{tenant_id}/users/{user_id}")
async def delete_tenant_user(
    tenant_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a user from a tenant - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        # Remove user from tenant
        tenant_user = db.query(TenantUser).filter(
            TenantUser.tenant_id == tenant_id,
            TenantUser.userId == user_id
        ).first()
        
        if not tenant_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in this tenant"
            )
        
        db.delete(tenant_user)
        db.commit()
        
        return {
            "success": True,
            "message": "User removed from tenant successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing user from tenant: {str(e)}"
        )

@router.delete("/tenants/{tenant_id}/invoices/{invoice_id}")
async def delete_tenant_invoice(
    tenant_id: str,
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete an invoice from a tenant - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        from ...config.invoice_models import Invoice
        
        invoice = db.query(Invoice).filter(
            Invoice.id == invoice_id,
            Invoice.tenant_id == tenant_id
        ).first()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        db.delete(invoice)
        db.commit()
        
        return {
            "success": True,
            "message": "Invoice deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting invoice: {str(e)}"
        )

@router.delete("/tenants/{tenant_id}/projects/{project_id}")
async def delete_tenant_project(
    tenant_id: str,
    project_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a project from a tenant - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        from ...config.project_models import Project
        
        project = db.query(Project).filter(
            Project.id == project_id,
            Project.tenant_id == tenant_id
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        db.delete(project)
        db.commit()
        
        return {
            "success": True,
            "message": "Project deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting project: {str(e)}"
        )

@router.delete("/tenants/{tenant_id}/customers/{customer_id}")
async def delete_tenant_customer(
    tenant_id: str,
    customer_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a customer from a tenant - Super Admin only"""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    
    try:
        from ...config.crm_models import Customer
        
        customer = db.query(Customer).filter(
            Customer.id == customer_id,
            Customer.tenant_id == tenant_id
        ).first()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        db.delete(customer)
        db.commit()
        
        return {
            "success": True,
            "message": "Customer deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting customer: {str(e)}"
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
