from fastapi import Depends
from ...core.mediator import Mediator
from ...config.database import get_db
from ...infrastructure.unit_of_work import UnitOfWork
from ...application.handler_registration import register_all_handlers
from sqlalchemy.orm import Session

def get_mediator(db: Session = Depends(get_db)) -> Mediator:
    mediator = Mediator()
    register_all_handlers(mediator, db)
    return mediator

