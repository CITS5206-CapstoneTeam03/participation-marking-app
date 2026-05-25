from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import ParticipationMark, User, StudentWorkshopMembership, AuditLog


class Workshop(Base):
    __tablename__ = "workshops"

    workshop_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workshop_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    tutor_user_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
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

    participation_marks: Mapped[list["ParticipationMark"]] = relationship(
        "ParticipationMark",
        back_populates="workshop",
    )

    tutor: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="workshops_tutored",
        foreign_keys=[tutor_user_id],
    )

    student_memberships: Mapped[list["StudentWorkshopMembership"]] = relationship(
        "StudentWorkshopMembership",
        back_populates="workshop",
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="workshop",
    )

    def __repr__(self) -> str:
        return f"<Workshop {self.workshop_id} {self.workshop_name}>"

    @property
    def tutor_name(self) -> Optional[str]:
        return self.tutor.display_name if self.tutor else None

    @property
    def tutor_email(self) -> Optional[str]:
        return self.tutor.email if self.tutor else None
