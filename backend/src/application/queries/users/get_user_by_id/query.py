from dataclasses import dataclass
from typing import Optional
from ....core.query import IQuery

@dataclass
class GetUserByIdQuery(IQuery):
    user_id: str

