from sqlalchemy import Column, String
from sqlmodel import Field

from app.models.entity import Entity


class User(Entity, table=True):
    __tablename__ = "users"

    username: str = Field(sa_column=Column("user_name", String(255), nullable=False, index=True))
    email: str = Field(sa_column=Column(String(255), nullable=False, unique=True, index=True))
    first_name: str | None = Field(default=None, sa_column=Column(String(255), nullable=True))
    last_name: str | None = Field(default=None, sa_column=Column(String(255), nullable=True))
    password_hash: str = Field(sa_column=Column("hashed_password", String(255), nullable=False))
    is_active: bool = Field(default=True)
