import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, String, func, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import ParticipationMark, StudentWorkshopMembership, AuditLog


class StudentStatus(str, enum.Enum):
    ACTIVE = "active"
    WITHDRAWN = "withdrawn"


class Student(Base):
    __tablename__ = "students"

    student_id: Mapped[str] = mapped_column(String(20), primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    preferred_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # Changed from String(500) to Text so the MVP can store a base64 data URL
    # produced by the manual photo matching UI.
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[StudentStatus] = mapped_column(
        Enum(StudentStatus, name="student_status"),
        nullable=False,
        default=StudentStatus.ACTIVE,
    )

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
        back_populates="student",
    )

    workshop_memberships: Mapped[list["StudentWorkshopMembership"]] = relationship(
        "StudentWorkshopMembership",
        back_populates="student",
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="student",
    )

    def __repr__(self) -> str:
        return f"<Student {self.student_id} {self.email}>"