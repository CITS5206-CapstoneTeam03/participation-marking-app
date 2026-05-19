from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.db import Base

if TYPE_CHECKING:
    from . import User


class SystemConfig(Base):
    __tablename__ = "system_config"

    config_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    coordinator_user_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    max_weekly_score: Mapped[int] = mapped_column(Integer, nullable=False, default=3.0)
    total_participation_points: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)

    is_configured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    week6_lock_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    week6_locked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    week12_lock_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    week12_locked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    updated_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    coordinator_user: Mapped["User"] = relationship(
        "User",
        back_populates="coordinated_configs",
        foreign_keys=[coordinator_user_id],
    )

    updated_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="updated_configs",
        foreign_keys=[updated_by_user_id],
    )

    def __repr__(self) -> str:
        return f"<SystemConfig config_id={self.config_id} configured={self.is_configured}>"