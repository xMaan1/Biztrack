from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from ..config.notification_crud import (
    create_notification, get_user_notifications, get_unread_count,
    mark_notification_as_read, mark_notification_as_unread, mark_all_notifications_as_read,
    delete_notification, delete_old_notifications, is_notification_enabled,
    create_or_update_notification_preference, get_user_notification_preferences
)
from ..config.notification_models import NotificationType, NotificationCategory
from ..config.core_crud import get_tenant_users

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(
        self,
        tenant_id: str,
        user_id: str,
        title: str,
        message: str,
        category: NotificationCategory,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        notification_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Create a new notification for a user"""
        try:
            # Check if user has notifications enabled for this category
            if not is_notification_enabled(self.db, tenant_id, user_id, category, 'in_app'):
                return False
            
            notification_data = {
                "id": str(uuid.uuid4()),
                "tenant_id": tenant_id,
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": type,
                "category": category,
                "action_url": action_url,
                "notification_data": notification_data or {},
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            create_notification(notification_data, self.db)
            return True
        except Exception as e:
            print(f"Error creating notification: {str(e)}")
            return False
    
    def create_bulk_notifications(
        self,
        tenant_id: str,
        user_ids: List[str],
        title: str,
        message: str,
        category: NotificationCategory,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        notification_data: Optional[Dict[str, Any]] = None
    ) -> int:
        """Create notifications for multiple users"""
        created_count = 0
        for user_id in user_ids:
            if self.create_notification(tenant_id, user_id, title, message, category, type, action_url, notification_data):
                created_count += 1
        return created_count
    
    def create_notification_for_all_tenant_users(
        self,
        tenant_id: str,
        title: str,
        message: str,
        category: NotificationCategory,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        notification_data: Optional[Dict[str, Any]] = None
    ) -> int:
        """Create notifications for all active users in a tenant"""
        tenant_users = get_tenant_users(tenant_id, self.db, skip=0, limit=10000)
        user_ids = [str(tu.userId) for tu in tenant_users if tu.isActive]
        return self.create_bulk_notifications(
            tenant_id, user_ids, title, message, category, type, action_url, notification_data
        )
    
    def get_user_notifications(
        self,
        tenant_id: str,
        user_id: str,
        page: int = 1,
        limit: int = 50,
        is_read: Optional[bool] = None,
        category: Optional[NotificationCategory] = None,
        type: Optional[NotificationType] = None
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user with pagination and filters"""
        skip = (page - 1) * limit
        notifications = get_user_notifications(
            self.db, tenant_id, user_id, skip, limit, is_read, category, type
        )
        
        return [
            {
                "id": str(notification.id),
                "tenant_id": str(notification.tenant_id),
                "user_id": str(notification.user_id),
                "title": notification.title,
                "message": notification.message,
                "type": notification.type.value,
                "category": notification.category.value,
                "is_read": notification.is_read,
                "read_at": notification.read_at.isoformat() if notification.read_at else None,
                "action_url": notification.action_url,
                "metadata": notification.notification_data,
                "created_at": notification.created_at.isoformat(),
                "updated_at": notification.updated_at.isoformat()
            }
            for notification in notifications
        ]
    
    def get_unread_count(self, tenant_id: str, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        return get_unread_count(self.db, tenant_id, user_id)
    
    def mark_as_read(self, notification_id: str, tenant_id: str, user_id: str) -> bool:
        """Mark a notification as read"""
        notification = mark_notification_as_read(notification_id, self.db, tenant_id, user_id)
        return notification is not None
    
    def mark_as_unread(self, notification_id: str, tenant_id: str, user_id: str) -> bool:
        """Mark a notification as unread"""
        notification = mark_notification_as_unread(notification_id, self.db, tenant_id, user_id)
        return notification is not None
    
    def mark_all_as_read(self, tenant_id: str, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        return mark_all_notifications_as_read(self.db, tenant_id, user_id)
    
    def delete_notification(self, notification_id: str, tenant_id: str, user_id: str) -> bool:
        """Delete a notification"""
        return delete_notification(notification_id, self.db, tenant_id, user_id)
    
    def cleanup_old_notifications(self, tenant_id: str, user_id: str, days_old: int = 30) -> int:
        """Delete old read notifications"""
        return delete_old_notifications(self.db, tenant_id, user_id, days_old)
    
    def get_notification_preferences(self, tenant_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get notification preferences for a user"""
        preferences = get_user_notification_preferences(self.db, tenant_id, user_id)
        return [
            {
                "id": str(pref.id),
                "tenant_id": str(pref.tenant_id),
                "user_id": str(pref.user_id),
                "category": pref.category.value,
                "email_enabled": pref.email_enabled,
                "push_enabled": pref.push_enabled,
                "in_app_enabled": pref.in_app_enabled,
                "created_at": pref.created_at.isoformat(),
                "updated_at": pref.updated_at.isoformat()
            }
            for pref in preferences
        ]
    
    def update_notification_preference(
        self,
        tenant_id: str,
        user_id: str,
        category: NotificationCategory,
        email_enabled: Optional[bool] = None,
        push_enabled: Optional[bool] = None,
        in_app_enabled: Optional[bool] = None
    ) -> bool:
        """Update notification preferences for a user"""
        try:
            preference_data = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "category": category,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            if email_enabled is not None:
                preference_data["email_enabled"] = email_enabled
            if push_enabled is not None:
                preference_data["push_enabled"] = push_enabled
            if in_app_enabled is not None:
                preference_data["in_app_enabled"] = in_app_enabled
            
            create_or_update_notification_preference(preference_data, self.db)
            return True
        except Exception as e:
            print(f"Error updating notification preference: {str(e)}")
            return False

# Helper functions for creating specific types of notifications
def create_hrm_notification(
    db: Session,
    tenant_id: str,
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Create an HRM-related notification"""
    service = NotificationService(db)
    return service.create_notification(
        tenant_id, user_id, title, message, NotificationCategory.HRM, type, action_url, notification_data
    )

def create_hrm_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create HRM-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.HRM, type, action_url, notification_data
    )

def create_inventory_notification(
    db: Session,
    tenant_id: str,
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.WARNING,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Create an inventory-related notification"""
    service = NotificationService(db)
    return service.create_notification(
        tenant_id, user_id, title, message, NotificationCategory.INVENTORY, type, action_url, notification_data
    )

def create_inventory_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.WARNING,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create inventory-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.INVENTORY, type, action_url, notification_data
    )

def create_system_notification(
    db: Session,
    tenant_id: str,
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Create a system-related notification"""
    service = NotificationService(db)
    return service.create_notification(
        tenant_id, user_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )

def create_system_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create system-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )

def create_crm_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create CRM-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.CRM, type, action_url, notification_data
    )

def create_project_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create project-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )

def create_event_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create event-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )
