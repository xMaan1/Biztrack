from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
import uuid

TEntity = TypeVar('TEntity')

class IRepository(ABC, Generic[TEntity]):
    @abstractmethod
    def get_by_id(self, entity_id: str, tenant_id: Optional[str] = None) -> Optional[TEntity]:
        pass

    @abstractmethod
    def get_all(self, tenant_id: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[TEntity]:
        pass

    @abstractmethod
    def add(self, entity: TEntity) -> TEntity:
        pass

    @abstractmethod
    def update(self, entity: TEntity) -> TEntity:
        pass

    @abstractmethod
    def delete(self, entity_id: str, tenant_id: Optional[str] = None) -> bool:
        pass

    @abstractmethod
    def count(self, tenant_id: Optional[str] = None) -> int:
        pass

class BaseRepository(IRepository[TEntity], Generic[TEntity]):
    def __init__(self, session: Session, entity_type: type):
        self._session = session
        self._entity_type = entity_type

    def get_by_id(self, entity_id: str, tenant_id: Optional[str] = None) -> Optional[TEntity]:
        try:
            uuid.UUID(entity_id)
        except (ValueError, TypeError):
            return None
        
        query = self._session.query(self._entity_type).filter(self._entity_type.id == entity_id)
        
        if tenant_id and hasattr(self._entity_type, 'tenant_id'):
            query = query.filter(self._entity_type.tenant_id == tenant_id)
        
        return query.first()

    def get_all(
        self,
        tenant_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        order_desc: bool = False
    ) -> List[TEntity]:
        query = self._session.query(self._entity_type)
        
        if tenant_id and hasattr(self._entity_type, 'tenant_id'):
            query = query.filter(self._entity_type.tenant_id == tenant_id)
        
        if order_by and hasattr(self._entity_type, order_by):
            order_column = getattr(self._entity_type, order_by)
            query = query.order_by(desc(order_column) if order_desc else asc(order_column))
        
        return query.offset(skip).limit(limit).all()

    def add(self, entity: TEntity) -> TEntity:
        self._session.add(entity)
        self._session.flush()
        return entity

    def update(self, entity: TEntity) -> TEntity:
        self._session.flush()
        return entity

    def delete(self, entity_id: str, tenant_id: Optional[str] = None) -> bool:
        entity = self.get_by_id(entity_id, tenant_id)
        if entity:
            self._session.delete(entity)
            self._session.flush()
            return True
        return False

    def count(self, tenant_id: Optional[str] = None) -> int:
        query = self._session.query(self._entity_type)
        
        if tenant_id and hasattr(self._entity_type, 'tenant_id'):
            query = query.filter(self._entity_type.tenant_id == tenant_id)
        
        return query.count()

    def find_by(self, filters: Dict[str, Any], tenant_id: Optional[str] = None) -> List[TEntity]:
        query = self._session.query(self._entity_type)
        
        if tenant_id and hasattr(self._entity_type, 'tenant_id'):
            query = query.filter(self._entity_type.tenant_id == tenant_id)
        
        for key, value in filters.items():
            if hasattr(self._entity_type, key):
                query = query.filter(getattr(self._entity_type, key) == value)
        
        return query.all()

    def find_one_by(self, filters: Dict[str, Any], tenant_id: Optional[str] = None) -> Optional[TEntity]:
        results = self.find_by(filters, tenant_id)
        return results[0] if results else None

