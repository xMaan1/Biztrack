from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from .....models.projects import Task


def get_task_by_id(task_id: str, db: Session, tenant_id: str = None) -> Optional[Task]:
    query = db.query(Task).filter(Task.id == task_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.first()

def get_all_tasks(db: Session, tenant_id: str = None, project_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    query = db.query(Task)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    if project_id:
        query = query.filter(Task.projectId == project_id)
    return query.order_by(Task.createdAt.desc()).offset(skip).limit(limit).all()

def get_tasks_by_project(project_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    """Get all tasks for a specific project"""
    query = db.query(Task).filter(Task.projectId == project_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).offset(skip).limit(limit).all()

def get_subtasks_by_parent(parent_task_id: str, db: Session, tenant_id: str = None) -> List[Task]:
    """Get all subtasks for a specific parent task"""
    query = db.query(Task).filter(Task.parentTaskId == parent_task_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).all()

def get_main_tasks_by_project(project_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    """Get only main tasks (no parent) for a specific project"""
    query = db.query(Task).filter(
        Task.projectId == project_id,
        Task.parentTaskId.is_(None)
    )
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).offset(skip).limit(limit).all()

def get_task_with_subtasks(task_id: str, db: Session, tenant_id: str = None) -> Optional[Task]:
    """Get a task with all its subtasks"""
    task = get_task_by_id(task_id, db, tenant_id)
    if task:
        task.subtasks = get_subtasks_by_parent(str(task.id), db, tenant_id)
    return task

def get_tasks_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    query = db.query(Task).filter(Task.assignedToId == assignee_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.dueDate.asc()).offset(skip).limit(limit).all()

def get_tasks_by_creator(creator_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Task]:
    query = db.query(Task).filter(Task.createdById == creator_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.order_by(Task.createdAt.desc()).offset(skip).limit(limit).all()

def create_task(task_data: dict, db: Session) -> Task:
    db_task = Task(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(task_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Task]:
    task = get_task_by_id(task_id, db, tenant_id)
    if task:
        for key, value in update_data.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)
        task.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(task)
    return task

def delete_task(task_id: str, db: Session, tenant_id: str = None) -> bool:
    task = get_task_by_id(task_id, db, tenant_id)
    if task:
        # First, delete or update related time entries
        from .....config.hrm_models import TimeEntry
        time_entries = db.query(TimeEntry).filter(
            TimeEntry.taskId == task_id,
            TimeEntry.tenant_id == tenant_id
        ).all()
        
        for time_entry in time_entries:
            time_entry.taskId = None  # Set to NULL instead of deleting
        
        # Delete subtasks first (if any)
        subtasks = db.query(Task).filter(
            Task.parentTaskId == task_id,
            Task.tenant_id == tenant_id
        ).all()
        
        for subtask in subtasks:
            subtask.parentTaskId = None  # Remove parent reference
        
        # Now delete the task
        db.delete(task)
        db.commit()
        return True
    return False

def get_task_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_tasks = db.query(Task).filter(Task.tenant_id == tenant_id).count()
    todo_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status == "todo"
    ).count()
    in_progress_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status == "in_progress"
    ).count()
    completed_tasks = db.query(Task).filter(
        Task.tenant_id == tenant_id,
        Task.status == "completed"
    ).count()
    
    return {
        "total": total_tasks,
        "todo": todo_tasks,
        "in_progress": in_progress_tasks,
        "completed": completed_tasks
    }
