import uuid
import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, DateTime, func, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import (
        ParticipationMark,
        Workshop,
        SystemConfig,
        StudentWorkshopMembership,
        AuditLog,
    )


class UserRole(str, enum.Enum):
    UC = "UC"
    TUTOR = "tutor"


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # Keep Karl's existing field name to match current codebase usage
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    marks_given: Mapped[list["ParticipationMark"]] = relationship(
        "ParticipationMark",
        back_populates="marked_by_user",
    )

    workshops_tutored: Mapped[list["Workshop"]] = relationship(
        "Workshop",
        back_populates="tutor",
        foreign_keys="Workshop.tutor_user_id",
    )

    coordinated_configs: Mapped[list["SystemConfig"]] = relationship(
        "SystemConfig",
        back_populates="coordinator_user",
        foreign_keys="SystemConfig.coordinator_user_id",
    )

    updated_configs: Mapped[list["SystemConfig"]] = relationship(
        "SystemConfig",
        back_populates="updated_by_user",
        foreign_keys="SystemConfig.updated_by_user_id",
    )

    memberships_created: Mapped[list["StudentWorkshopMembership"]] = relationship(
        "StudentWorkshopMembership",
        back_populates="created_by_user",
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"