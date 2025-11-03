from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from ...infrastructure.repository import BaseRepository
from ...domain.entities.project_entity import Project, Task

class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: Session):
        super().__init__(session, Project)

    def get_all(
        self,
        tenant_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        order_desc: bool = False
    ) -> List[Project]:
        query = self._session.query(Project)
        
        if tenant_id:
            query = query.filter(Project.tenant_id == tenant_id)
        
        if order_by and hasattr(Project, order_by):
            order_column = getattr(Project, order_by)
            query = query.order_by(desc(order_column) if order_desc else asc(order_column))
        else:
            query = query.order_by(Project.createdAt.desc())
        
        return query.offset(skip).limit(limit).all()

    def get_by_manager(self, manager_id: str, tenant_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[Project]:
        query = self._session.query(Project).filter(Project.projectManagerId == manager_id)
        
        if tenant_id:
            query = query.filter(Project.tenant_id == tenant_id)
        
        return query.order_by(Project.createdAt.desc()).offset(skip).limit(limit).all()

class TaskRepository(BaseRepository[Task]):
    def __init__(self, session: Session):
        super().__init__(session, Task)

    def get_by_project(self, project_id: str, tenant_id: Optional[str] = None) -> List[Task]:
        query = self._session.query(Task).filter(Task.projectId == project_id)
        
        if tenant_id:
            query = query.filter(Task.tenant_id == tenant_id)
        
        return query.all()

    def get_by_assignee(self, assignee_id: str, tenant_id: Optional[str] = None) -> List[Task]:
        query = self._session.query(Task).filter(Task.assignedToId == assignee_id)
        
        if tenant_id:
            query = query.filter(Task.tenant_id == tenant_id)
        
        return query.all()

