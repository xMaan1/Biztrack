from abc import ABC, abstractmethod
from typing import Protocol
from sqlalchemy.orm import Session
from .repository import IRepository

class IUnitOfWork(ABC):
    @abstractmethod
    def __enter__(self):
        pass

    @abstractmethod
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    @abstractmethod
    def commit(self):
        pass

    @abstractmethod
    def rollback(self):
        pass

    @abstractmethod
    def flush(self):
        pass

class UnitOfWork(IUnitOfWork):
    def __init__(self, session: Session):
        self._session = session
        self._repositories: dict = {}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        return False

    def register_repository(self, name: str, repository: IRepository):
        """Register a repository with the Unit of Work"""
        self._repositories[name] = repository

    def get_repository(self, name: str) -> IRepository:
        """Get a registered repository"""
        if name not in self._repositories:
            raise ValueError(f"Repository '{name}' is not registered")
        return self._repositories[name]

    def commit(self):
        """Commit all changes"""
        self._session.commit()

    def rollback(self):
        """Rollback all changes"""
        self._session.rollback()

    def flush(self):
        """Flush pending changes to database"""
        self._session.flush()

    @property
    def session(self) -> Session:
        """Get the underlying session"""
        return self._session

