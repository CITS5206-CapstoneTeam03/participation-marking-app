from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import User, Student, Workshop, EnabledWeek


class ParticipationMark(Base):
    __tablename__ = "participation_marks"
    __table_args__ = (
        UniqueConstraint("student_id", "week_number", name="uq_student_week"),
        CheckConstraint("score >= 0 AND score <= 3", name="ck_participation_marks_score_range"),
        Index(
            "ix_participation_marks_student_workshop_week",
            "student_id",
            "workshop_id",
            "week_number",
        ),
    )

    mark_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

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

    week_number: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("enabled_weeks.week_number", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    score: Mapped[int] = mapped_column(Integer, nullable=False)

    marked_by_user_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    marked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    marked_by_user: Mapped["User"] = relationship(
        "User",
        back_populates="marks_given",
    )

    student: Mapped["Student"] = relationship(
        "Student",
        back_populates="participation_marks",
    )

    workshop: Mapped["Workshop"] = relationship(
        "Workshop",
        back_populates="participation_marks",
    )

    enabled_week: Mapped["EnabledWeek"] = relationship(
        "EnabledWeek",
        back_populates="participation_marks",
    )

    def __repr__(self) -> str:
        return (
            f"<ParticipationMark mark_id={self.mark_id} student_id={self.student_id} "
            f"workshop_id={self.workshop_id} week={self.week_number} score={self.score}>"
        )