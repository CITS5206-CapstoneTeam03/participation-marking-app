from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import User, Student, Workshop


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_log_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    user_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    student_id: Mapped[Optional[str]] = mapped_column(
        String(20),
        ForeignKey("students.student_id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    workshop_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("workshops.workshop_id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    week_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    old_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    new_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="audit_logs",
    )

    student: Mapped[Optional["Student"]] = relationship(
        "Student",
        back_populates="audit_logs",
    )

    workshop: Mapped[Optional["Workshop"]] = relationship(
        "Workshop",
        back_populates="audit_logs",
    )

    def __repr__(self) -> str:
        return f"<AuditLog audit_log_id={self.audit_log_id} action_type={self.action_type}>"