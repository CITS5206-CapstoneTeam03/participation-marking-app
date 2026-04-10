from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base

if TYPE_CHECKING:
	from models.users import User


class ParticipationMark(Base):
	__tablename__ = "participation_marks"
	__table_args__ = (
		Index(
			"ix_participation_marks_student_workshop_week",
			"student_id",
			"workshop_id",
			"week_number",
		),
	)

	mark_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
	student_id: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
	workshop_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
	week_number: Mapped[int] = mapped_column(Integer, nullable=False)
	score: Mapped[int] = mapped_column(Integer, nullable=False)

	# Each mark must be created by exactly one user.
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

	def __repr__(self) -> str:
		return (
			f"<ParticipationMark mark_id={self.mark_id} student_id={self.student_id} "
			f"workshop_id={self.workshop_id} week={self.week_number} score={self.score}>"
		)
