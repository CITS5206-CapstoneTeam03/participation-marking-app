from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import Student, Workshop, User


class StudentWorkshopMembership(Base):
    __tablename__ = "student_workshop_memberships"

    membership_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    student_id: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("students.student_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    workshop_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("workshops.workshop_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    student: Mapped["Student"] = relationship(
        "Student",
        back_populates="workshop_memberships",
    )

    workshop: Mapped["Workshop"] = relationship(
        "Workshop",
        back_populates="student_memberships",
    )

    created_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="memberships_created",
    )

    def __repr__(self) -> str:
        return (
            f"<StudentWorkshopMembership membership_id={self.membership_id} "
            f"student_id={self.student_id} workshop_id={self.workshop_id} is_current={self.is_current}>"
        )