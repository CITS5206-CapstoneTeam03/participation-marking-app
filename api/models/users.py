import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, func, Enum
from sqlalchemy.orm import Mapped, mapped_column

# Assuming Base is provided by your db configuration
from db import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    UC = "uc"
    FACILITATOR = "facilitator"

class User(Base):
    __tablename__ = "users"

    # SQLAlchemy 2.0 Best Practice: Use Mapped and mapped_column for strong typing.
    # We default the user_id to a uuid string if they don't provide one.
    user_id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Industry best practice: store hashed passwords (e.g. bcrypt/argon2), never plain text.
    # String(255) is used to safely accommodate the lengths of standard hashing outputs.
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_name: Mapped[str] = mapped_column(String(100), nullable=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    
    # Use SQLAlchemy Enum coupled with Python Enum for strictly typing Roles
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    def __repr__(self) -> str:
        return f"<User {self.email}>"
