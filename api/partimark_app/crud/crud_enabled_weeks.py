from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.enabled_weeks import EnabledWeek


def get_enabled_week(db: Session, week_number: int) -> Optional[EnabledWeek]:
    """Retrieve one enabled week by week number."""
    return (
        db.query(EnabledWeek)
        .filter(EnabledWeek.week_number == week_number)
        .first()
    )


def get_enabled_weeks(db: Session) -> List[EnabledWeek]:
    """Retrieve all enabled weeks ordered by week_number."""
    return db.query(EnabledWeek).order_by(EnabledWeek.week_number.asc()).all()


def create_enabled_week(db: Session, week_data: dict) -> EnabledWeek:
    """Create one enabled week."""
    enabled_week = EnabledWeek(**week_data)
    db.add(enabled_week)
    db.commit()
    db.refresh(enabled_week)
    _sync_system_config_points(db)
    return enabled_week


def create_enabled_weeks_bulk(db: Session, weeks_data: List[dict]) -> List[EnabledWeek]:
    """Create multiple enabled weeks."""
    enabled_weeks = [EnabledWeek(**data) for data in weeks_data]
    db.add_all(enabled_weeks)
    db.commit()
    for week in enabled_weeks:
        db.refresh(week)
    _sync_system_config_points(db)
    return enabled_weeks


def replace_enabled_weeks(db: Session, week_numbers: List[int]) -> List[EnabledWeek]:
    """
    Replace all enabled weeks with a new set.

    Useful for the coordinator Settings screen when saving the full week selection.
    """
    db.query(EnabledWeek).delete()
    db.commit()

    enabled_weeks = [EnabledWeek(week_number=week_number) for week_number in sorted(set(week_numbers))]
    db.add_all(enabled_weeks)
    db.commit()

    for week in enabled_weeks:
        db.refresh(week)

    _sync_system_config_points(db)
    return enabled_weeks


def delete_enabled_week(db: Session, db_enabled_week: EnabledWeek) -> None:
    """Delete one enabled week."""
    db.delete(db_enabled_week)
    db.commit()
    _sync_system_config_points(db)

def _sync_system_config_points(db: Session) -> None:
    from .crud_system_config import get_current_system_config, update_system_config
    
    config = get_current_system_config(db)
    if config:
        weeks = get_enabled_weeks(db)
        expected_points = len(weeks) * 3 if weeks else None
        if config.total_participation_points != expected_points:
            update_system_config(db, config, {"total_participation_points": expected_points})

def get_max_score(db: Session, week: int) -> int:
    """Calculate the maximum possible score up to a specific week."""
    weeks = get_enabled_weeks(db)
    
    # Filter the enabled weeks up to the given week
    target_weeks = [x for x in weeks if x.week_number <= week]
    
    # Each enabled week is worth 3 points
    return len(target_weeks) * 3