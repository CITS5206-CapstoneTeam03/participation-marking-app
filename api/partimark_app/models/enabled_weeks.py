from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import ParticipationMark


class EnabledWeek(Base):
    __tablename__ = "enabled_weeks"

    week_number: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    participation_marks: Mapped[list["ParticipationMark"]] = relationship(
        "ParticipationMark",
        back_populates="enabled_week",
    )

    def __repr__(self) -> str:
        return f"<EnabledWeek week_number={self.week_number}>"