from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.db import Base

if TYPE_CHECKING:
    from models import ParticipationMark
    from models import User


class Workshop(Base):
    __tablename__ = "workshops"

    workshop_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workshop_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    
    # The tutor/instructor who leads this workshop.
    tutor_user_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    # One workshop can have zero or many participation marks.
    participation_marks: Mapped[list["ParticipationMark"]] = relationship(
        "ParticipationMark",
        back_populates="workshop",
    )

    # One user (tutor) can lead many workshops.
    tutor: Mapped["User"] = relationship(
        "User",
        back_populates="workshops_tutored",
    )

    def __repr__(self) -> str:
        return f"<Workshop {self.workshop_id} {self.workshop_name}>"
