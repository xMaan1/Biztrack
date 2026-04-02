from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..config.core_models import User, TenantUser, Role, Tenant
from ..models.common import ModulePermission, TenantRole
import logging

logger = logging.getLogger(__name__)

def _crud(prefix: str) -> List[str]:
    return [f"{prefix}:view", f"{prefix}:create", f"{prefix}:update", f"{prefix}:delete"]


GRANULAR_PERMISSIONS = {
    "crm": [
        "crm:dashboard:view",
        *_crud("crm:customers"),
        *_crud("crm:companies"),
        *_crud("crm:contacts"),
        *_crud("crm:leads"),
        *_crud("crm:opportunities"),
        *_crud("crm:activities"),
    ],
    "sales": [
        *_crud("sales:quotes"),
        *_crud("sales:contracts"),
        "sales:analytics:view",
        *_crud("sales:invoices"),
        *_crud("sales:installments"),
        *_crud("sales:delivery_notes"),
    ],
    "hrm": [
        *_crud("hrm:employees"),
        *_crud("hrm:jobs"),
        *_crud("hrm:reviews"),
        *_crud("hrm:leave_requests"),
        *_crud("hrm:training"),
        *_crud("hrm:payroll"),
        *_crud("hrm:suppliers"),
    ],
    "inventory": [
        *_crud("inventory:warehouses"),
        *_crud("inventory:storage_locations"),
        *_crud("inventory:stock_movements"),
        *_crud("inventory:purchase_orders"),
        *_crud("inventory:receiving"),
        *_crud("inventory:products"),
        *_crud("inventory:alerts"),
        *_crud("inventory:dumps"),
        *_crud("inventory:customer_returns"),
        *_crud("inventory:supplier_returns"),
    ],
    "projects": [
        *_crud("projects:projects"),
        *_crud("projects:tasks"),
        *_crud("projects:team_members"),
        *_crud("projects:time_tracking"),
    ],
    "production": [
        *_crud("production:work_orders"),
        *_crud("production:job_cards"),
        *_crud("production:vehicles"),
    ],
    "quality": [
        *_crud("quality:quality_control"),
    ],
    "maintenance": [
        *_crud("maintenance:schedules"),
        *_crud("maintenance:work_orders"),
        *_crud("maintenance:equipment"),
        *_crud("maintenance:reports"),
    ],
    "banking": [
        *_crud("banking:accounts"),
        *_crud("banking:transactions"),
        *_crud("banking:reconciliation"),
        *_crud("banking:tills"),
        *_crud("banking:till_transactions"),
    ],
    "ledger": [
        *_crud("ledger:chart_of_accounts"),
        *_crud("ledger:transactions"),
        *_crud("ledger:journal_entries"),
        *_crud("ledger:budgets"),
        *_crud("ledger:account_receivables"),
        "ledger:reports:view",
        "ledger:profit_loss:view",
    ],
    "pos": [
        *_crud("pos:sale"),
        *_crud("pos:products"),
        *_crud("pos:transactions"),
        *_crud("pos:shifts"),
        "pos:reports:view",
    ],
    "healthcare": [
        *_crud("healthcare:appointments"),
        *_crud("healthcare:patients"),
        *_crud("healthcare:doctors"),
        *_crud("healthcare:staff"),
        *_crud("healthcare:admissions"),
        *_crud("healthcare:expenses"),
    ],
}


def _merge_permissions(*groups: List[str]) -> List[str]:
    merged: List[str] = []
    for group in groups:
        for permission in group:
            value = permission.value if isinstance(permission, ModulePermission) else permission
            if value not in merged:
                merged.append(value)
    return merged

class RBACService:
    
    DEFAULT_ROLE_PERMISSIONS = {
        TenantRole.OWNER: _merge_permissions([
            ModulePermission.CRM_VIEW, ModulePermission.CRM_CREATE, ModulePermission.CRM_UPDATE, ModulePermission.CRM_DELETE,
            ModulePermission.HRM_VIEW, ModulePermission.HRM_CREATE, ModulePermission.HRM_UPDATE, ModulePermission.HRM_DELETE,
            ModulePermission.INVENTORY_VIEW, ModulePermission.INVENTORY_CREATE, ModulePermission.INVENTORY_UPDATE, ModulePermission.INVENTORY_DELETE,
            ModulePermission.FINANCE_VIEW, ModulePermission.FINANCE_CREATE, ModulePermission.FINANCE_UPDATE, ModulePermission.FINANCE_DELETE,
            ModulePermission.SALES_VIEW, ModulePermission.SALES_CREATE, ModulePermission.SALES_UPDATE, ModulePermission.SALES_DELETE,
            ModulePermission.PROJECTS_VIEW, ModulePermission.PROJECTS_CREATE, ModulePermission.PROJECTS_UPDATE, ModulePermission.PROJECTS_DELETE,
            ModulePermission.PRODUCTION_VIEW, ModulePermission.PRODUCTION_CREATE, ModulePermission.PRODUCTION_UPDATE, ModulePermission.PRODUCTION_DELETE,
            ModulePermission.QUALITY_VIEW, ModulePermission.QUALITY_CREATE, ModulePermission.QUALITY_UPDATE, ModulePermission.QUALITY_DELETE,
            ModulePermission.MAINTENANCE_VIEW, ModulePermission.MAINTENANCE_CREATE, ModulePermission.MAINTENANCE_UPDATE, ModulePermission.MAINTENANCE_DELETE,
            ModulePermission.BANKING_VIEW, ModulePermission.BANKING_CREATE, ModulePermission.BANKING_UPDATE, ModulePermission.BANKING_DELETE,
            ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
            ModulePermission.USERS_VIEW, ModulePermission.USERS_CREATE, ModulePermission.USERS_UPDATE, ModulePermission.USERS_DELETE,
            ModulePermission.REPORTS_VIEW, ModulePermission.REPORTS_EXPORT,
            ModulePermission.HEALTHCARE_VIEW, ModulePermission.HEALTHCARE_CREATE, ModulePermission.HEALTHCARE_UPDATE, ModulePermission.HEALTHCARE_DELETE
        ], *[permissions for permissions in GRANULAR_PERMISSIONS.values()]),
        TenantRole.CRM_MANAGER: _merge_permissions([
            ModulePermission.CRM_VIEW, ModulePermission.CRM_CREATE, ModulePermission.CRM_UPDATE, ModulePermission.CRM_DELETE,
            ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
            ModulePermission.REPORTS_VIEW
        ], GRANULAR_PERMISSIONS["crm"]),
        TenantRole.HRM_MANAGER: _merge_permissions([
            ModulePermission.HRM_VIEW, ModulePermission.HRM_CREATE, ModulePermission.HRM_UPDATE, ModulePermission.HRM_DELETE,
            ModulePermission.REPORTS_VIEW
        ], GRANULAR_PERMISSIONS["hrm"]),
        TenantRole.INVENTORY_MANAGER: _merge_permissions([
            ModulePermission.INVENTORY_VIEW, ModulePermission.INVENTORY_CREATE, ModulePermission.INVENTORY_UPDATE, ModulePermission.INVENTORY_DELETE,
            ModulePermission.REPORTS_VIEW
        ], GRANULAR_PERMISSIONS["inventory"]),
        TenantRole.FINANCE_MANAGER: _merge_permissions([
            ModulePermission.FINANCE_VIEW, ModulePermission.FINANCE_CREATE, ModulePermission.FINANCE_UPDATE, ModulePermission.FINANCE_DELETE,
            ModulePermission.BANKING_VIEW, ModulePermission.BANKING_CREATE, ModulePermission.BANKING_UPDATE, ModulePermission.BANKING_DELETE,
            ModulePermission.REPORTS_VIEW, ModulePermission.REPORTS_EXPORT
        ], GRANULAR_PERMISSIONS["banking"], GRANULAR_PERMISSIONS["ledger"]),
        TenantRole.PROJECT_MANAGER: _merge_permissions([
            ModulePermission.PROJECTS_VIEW, ModulePermission.PROJECTS_CREATE, ModulePermission.PROJECTS_UPDATE, ModulePermission.PROJECTS_DELETE,
            ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
            ModulePermission.REPORTS_VIEW
        ], GRANULAR_PERMISSIONS["projects"]),
        TenantRole.PRODUCTION_MANAGER: _merge_permissions([
            ModulePermission.PRODUCTION_VIEW, ModulePermission.PRODUCTION_CREATE, ModulePermission.PRODUCTION_UPDATE, ModulePermission.PRODUCTION_DELETE,
            ModulePermission.REPORTS_VIEW
        ], GRANULAR_PERMISSIONS["production"]),
        TenantRole.QUALITY_MANAGER: _merge_permissions([
            ModulePermission.QUALITY_VIEW, ModulePermission.QUALITY_CREATE, ModulePermission.QUALITY_UPDATE, ModulePermission.QUALITY_DELETE,
            ModulePermission.REPORTS_VIEW
        ], GRANULAR_PERMISSIONS["quality"]),
        TenantRole.MAINTENANCE_MANAGER: _merge_permissions([
            ModulePermission.MAINTENANCE_VIEW, ModulePermission.MAINTENANCE_CREATE, ModulePermission.MAINTENANCE_UPDATE, ModulePermission.MAINTENANCE_DELETE,
            ModulePermission.REPORTS_VIEW
        ], GRANULAR_PERMISSIONS["maintenance"])
    }
    
    @staticmethod
    def create_default_roles(db: Session, tenant_id: str) -> List[Role]:
        """Create default roles for a tenant"""
        roles = []
        
        for role_name, permissions in RBACService.DEFAULT_ROLE_PERMISSIONS.items():
            role = Role(
                tenant_id=tenant_id,
                name=role_name.value,
                display_name=role_name.value.replace('_', ' ').title(),
                description=f"Default {role_name.value.replace('_', ' ')} role",
                permissions=[p.value if isinstance(p, ModulePermission) else p for p in permissions],
                isActive=True
            )
            db.add(role)
            roles.append(role)
        
        db.commit()
        return roles
    
    @staticmethod
    def get_user_permissions(db: Session, user_id: str, tenant_id: str) -> List[str]:
        """Get all permissions for a user in a tenant"""
        tenant_user = db.query(TenantUser).join(Role).filter(
            and_(
                TenantUser.userId == user_id,
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True
            )
        ).first()

        if not tenant_user:
            return []

        # Get role permissions
        role_permissions = tenant_user.role_obj.permissions if tenant_user.role_obj else []

        # Add custom permissions
        custom_permissions = tenant_user.custom_permissions or []

        # Combine and deduplicate
        all_permissions = list(set(role_permissions + custom_permissions))
        return all_permissions
    
    @staticmethod
    def has_permission(db: Session, user_id: str, tenant_id: str, permission: str) -> bool:
        """Check if user has specific permission"""
        if RBACService.is_owner(db, user_id, tenant_id):
            return True
        
        user_permissions = RBACService.get_user_permissions(db, user_id, tenant_id)
        return permission in user_permissions
    
    @staticmethod
    def has_module_access(db: Session, user_id: str, tenant_id: str, module: str) -> bool:
        """Check if user has access to a module (any permission for that module)"""
        user_permissions = RBACService.get_user_permissions(db, user_id, tenant_id)
        module_permissions = [p for p in user_permissions if p.startswith(f"{module}:")]
        return len(module_permissions) > 0
    
    @staticmethod
    def get_user_role(db: Session, user_id: str, tenant_id: str) -> Optional[Role]:
        """Get user's role in a tenant"""
        tenant_user = db.query(TenantUser).join(Role).filter(
            and_(
                TenantUser.userId == user_id,
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True
            )
        ).first()

        return tenant_user.role_obj if tenant_user else None
    
    @staticmethod
    def is_owner(db: Session, user_id: str, tenant_id: str) -> bool:
        """Check if user is owner of the tenant"""
        role = RBACService.get_user_role(db, user_id, tenant_id)
        return role and role.name == TenantRole.OWNER.value
    
    @staticmethod
    def can_manage_users(db: Session, user_id: str, tenant_id: str) -> bool:
        """Check if user can manage other users (owner or has user management permissions)"""
        if RBACService.is_owner(db, user_id, tenant_id):
            return True
        
        return RBACService.has_permission(db, user_id, tenant_id, ModulePermission.USERS_CREATE.value)
    
    @staticmethod
    def get_accessible_modules(db: Session, user_id: str, tenant_id: str) -> List[str]:
        """Get list of modules user has access to"""
        # Owners have access to all modules
        if RBACService.is_owner(db, user_id, tenant_id):
            all_modules = ['crm', 'sales', 'pos', 'inventory', 'hrm', 'projects', 'reports', 'events', 'work-orders', 'production', 'quality', 'maintenance', 'banking', 'ledger', 'finance', 'settings', 'notifications', 'users', 'dashboard', 'healthcare']
            return all_modules

        user_permissions = RBACService.get_user_permissions(db, user_id, tenant_id)
        modules = set()

        for permission in user_permissions:
            if ':' in permission:
                module = permission.split(':')[0]
                modules.add(module)

        accessible_modules = list(modules)
        logger.info(f"[RBAC DEBUG] Non-owner accessible modules: {accessible_modules}")
        logger.info(f"[RBAC DEBUG] User permissions: {user_permissions}")
        return accessible_modules
    
    @staticmethod
    def validate_email_uniqueness(db: Session, email: str, tenant_id: str = None, exclude_user_id: Optional[str] = None) -> bool:
        """Check if email is unique globally"""
        query = db.query(User).filter(User.email == email)
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        existing_user = query.first()
        return existing_user is None
    
    @staticmethod
    def validate_username_uniqueness(db: Session, username: str, tenant_id: str, exclude_user_id: Optional[str] = None) -> bool:
        """Check if username is unique within tenant"""
        query = db.query(User).join(TenantUser).filter(
            and_(
                User.userName == username,
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True
            )
        )
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        existing_user = query.first()
        return existing_user is None