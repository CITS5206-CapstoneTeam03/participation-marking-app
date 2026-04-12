from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.db import Base

if TYPE_CHECKING:
	from models import ParticipationMark


class Student(Base):
	__tablename__ = "students"

	student_id: Mapped[str] = mapped_column(String(20), primary_key=True, index=True)
	first_name: Mapped[str] = mapped_column(String(100), nullable=False)
	last_name: Mapped[str] = mapped_column(String(100), nullable=False)
	preferred_name: Mapped[str] = mapped_column(String(100), nullable=False)
	email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
	image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
	status: Mapped[str] = mapped_column(String(20), nullable=False)

	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
	updated_at: Mapped[Optional[datetime]] = mapped_column(
		DateTime(timezone=True),
		onupdate=func.now(),
		nullable=True,
	)

	# One student can have zero or many participation marks.
	participation_marks: Mapped[list["ParticipationMark"]] = relationship(
		"ParticipationMark",
		back_populates="student",
	)

	def __repr__(self) -> str:
		return f"<Student {self.student_id} {self.email}>"
