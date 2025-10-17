from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from ..config.core_models import User, TenantUser, Role, Tenant
from ..models.unified_models import ModulePermission, TenantRole
import logging

logger = logging.getLogger(__name__)

class RBACService:
    
    # Default role permissions mapping
    DEFAULT_ROLE_PERMISSIONS = {
        TenantRole.OWNER: [
            # Full access to all modules
            ModulePermission.CRM_VIEW, ModulePermission.CRM_CREATE, ModulePermission.CRM_UPDATE, ModulePermission.CRM_DELETE,
            ModulePermission.HRM_VIEW, ModulePermission.HRM_CREATE, ModulePermission.HRM_UPDATE, ModulePermission.HRM_DELETE,
            ModulePermission.INVENTORY_VIEW, ModulePermission.INVENTORY_CREATE, ModulePermission.INVENTORY_UPDATE, ModulePermission.INVENTORY_DELETE,
            ModulePermission.FINANCE_VIEW, ModulePermission.FINANCE_CREATE, ModulePermission.FINANCE_UPDATE, ModulePermission.FINANCE_DELETE,
            ModulePermission.PROJECTS_VIEW, ModulePermission.PROJECTS_CREATE, ModulePermission.PROJECTS_UPDATE, ModulePermission.PROJECTS_DELETE,
            ModulePermission.PRODUCTION_VIEW, ModulePermission.PRODUCTION_CREATE, ModulePermission.PRODUCTION_UPDATE, ModulePermission.PRODUCTION_DELETE,
            ModulePermission.QUALITY_VIEW, ModulePermission.QUALITY_CREATE, ModulePermission.QUALITY_UPDATE, ModulePermission.QUALITY_DELETE,
            ModulePermission.MAINTENANCE_VIEW, ModulePermission.MAINTENANCE_CREATE, ModulePermission.MAINTENANCE_UPDATE, ModulePermission.MAINTENANCE_DELETE,
            ModulePermission.BANKING_VIEW, ModulePermission.BANKING_CREATE, ModulePermission.BANKING_UPDATE, ModulePermission.BANKING_DELETE,
            ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
            ModulePermission.USERS_VIEW, ModulePermission.USERS_CREATE, ModulePermission.USERS_UPDATE, ModulePermission.USERS_DELETE,
            ModulePermission.REPORTS_VIEW, ModulePermission.REPORTS_EXPORT
        ],
        TenantRole.CRM_MANAGER: [
            ModulePermission.CRM_VIEW, ModulePermission.CRM_CREATE, ModulePermission.CRM_UPDATE, ModulePermission.CRM_DELETE,
            ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
            ModulePermission.REPORTS_VIEW
        ],
        TenantRole.HRM_MANAGER: [
            ModulePermission.HRM_VIEW, ModulePermission.HRM_CREATE, ModulePermission.HRM_UPDATE, ModulePermission.HRM_DELETE,
            ModulePermission.REPORTS_VIEW
        ],
        TenantRole.INVENTORY_MANAGER: [
            ModulePermission.INVENTORY_VIEW, ModulePermission.INVENTORY_CREATE, ModulePermission.INVENTORY_UPDATE, ModulePermission.INVENTORY_DELETE,
            ModulePermission.REPORTS_VIEW
        ],
        TenantRole.FINANCE_MANAGER: [
            ModulePermission.FINANCE_VIEW, ModulePermission.FINANCE_CREATE, ModulePermission.FINANCE_UPDATE, ModulePermission.FINANCE_DELETE,
            ModulePermission.BANKING_VIEW, ModulePermission.BANKING_CREATE, ModulePermission.BANKING_UPDATE, ModulePermission.BANKING_DELETE,
            ModulePermission.REPORTS_VIEW, ModulePermission.REPORTS_EXPORT
        ],
        TenantRole.PROJECT_MANAGER: [
            ModulePermission.PROJECTS_VIEW, ModulePermission.PROJECTS_CREATE, ModulePermission.PROJECTS_UPDATE, ModulePermission.PROJECTS_DELETE,
            ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
            ModulePermission.REPORTS_VIEW
        ],
        TenantRole.PRODUCTION_MANAGER: [
            ModulePermission.PRODUCTION_VIEW, ModulePermission.PRODUCTION_CREATE, ModulePermission.PRODUCTION_UPDATE, ModulePermission.PRODUCTION_DELETE,
            ModulePermission.REPORTS_VIEW
        ],
        TenantRole.QUALITY_MANAGER: [
            ModulePermission.QUALITY_VIEW, ModulePermission.QUALITY_CREATE, ModulePermission.QUALITY_UPDATE, ModulePermission.QUALITY_DELETE,
            ModulePermission.REPORTS_VIEW
        ],
        TenantRole.MAINTENANCE_MANAGER: [
            ModulePermission.MAINTENANCE_VIEW, ModulePermission.MAINTENANCE_CREATE, ModulePermission.MAINTENANCE_UPDATE, ModulePermission.MAINTENANCE_DELETE,
            ModulePermission.REPORTS_VIEW
        ]
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
                permissions=[p.value for p in permissions],
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
        role_permissions = tenant_user.role.permissions if tenant_user.role else []

        # Add custom permissions
        custom_permissions = tenant_user.custom_permissions or []

        # Combine and deduplicate
        all_permissions = list(set(role_permissions + custom_permissions))
        return all_permissions
    
    @staticmethod
    def has_permission(db: Session, user_id: str, tenant_id: str, permission: str) -> bool:
        """Check if user has specific permission"""
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

        return tenant_user.role if tenant_user else None
    
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
            all_modules = ['crm', 'sales', 'pos', 'inventory', 'hrm', 'projects', 'reports', 'events', 'work-orders', 'production', 'quality-control', 'maintenance', 'banking', 'ledger', 'settings', 'notifications', 'users']
            return all_modules

        user_permissions = RBACService.get_user_permissions(db, user_id, tenant_id)
        modules = set()

        for permission in user_permissions:
            if ':' in permission:
                module = permission.split(':')[0]
                modules.add(module)

        accessible_modules = list(modules)
        return accessible_modules
    
    @staticmethod
    def validate_email_uniqueness(db: Session, email: str, tenant_id: str, exclude_user_id: Optional[str] = None) -> bool:
        """Check if email is unique within tenant"""
        query = db.query(User).join(TenantUser).filter(
            and_(
                User.email == email,
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True
            )
        )
        
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        
        existing_user = query.first()
        return existing_user is None
