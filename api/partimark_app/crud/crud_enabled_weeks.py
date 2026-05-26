from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.enabled_weeks import EnabledWeek
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate


actions = [
    "enabled_weeks",
    "disabled_weeks",
    "replace_week"
]


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


def create_enabled_week(db: Session, week_data: dict, user_id: str) -> EnabledWeek:
    """Create one enabled week."""
    enabled_week = EnabledWeek(**week_data)

    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[0],
        description=f"Enabled week {enabled_week.week_number}",
        week_number=enabled_week.week_number
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(enabled_week)
    db.commit()
    db.refresh(enabled_week)
    _sync_system_config_points(db,user_id)
    return enabled_week



def create_enabled_weeks_bulk(db: Session, weeks_data: List[dict], user_id: str) -> List[EnabledWeek]:
    """Create multiple enabled weeks."""
    enabled_weeks = [EnabledWeek(**data) for data in weeks_data]

    for week in enabled_weeks:
        audit_in = AuditLogCreate(
            user_id=user_id,
            action_type=actions[0],
            description=f"Enabled week {week.week_number}",
            week_number=week.week_number
        )
        create_audit_log(db, log_data=audit_in.model_dump())

    db.add_all(enabled_weeks)
    db.commit()
    for week in enabled_weeks:
        db.refresh(week)
    _sync_system_config_points(db, user_id)
    return enabled_weeks



def replace_enabled_weeks(db: Session, week_numbers: List[int], user_id: str) -> List[EnabledWeek]:
    """
    Replace all enabled weeks with a new set.

    Useful for the coordinator Settings screen when saving the full week selection.
    """
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[2],
        description=f"Replaced enabled weeks with {sorted(set(week_numbers))}",
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    current_weeks = db.query(EnabledWeek).all()
    current_week_numbers = {w.week_number for w in current_weeks}
    target_week_numbers = set(week_numbers)

    # Delete weeks that are in the database but not in the new set
    weeks_to_delete = [w for w in current_weeks if w.week_number not in target_week_numbers]
    for w in weeks_to_delete:
        db.delete(w)

    # Insert weeks that are in the new set but not in the database
    weeks_to_add = target_week_numbers - current_week_numbers
    new_weeks = [EnabledWeek(week_number=wn) for wn in sorted(weeks_to_add)]
    db.add_all(new_weeks)
    db.commit()

    # Retrieve and return the updated, sorted list of enabled weeks from the database
    enabled_weeks = db.query(EnabledWeek).filter(EnabledWeek.week_number.in_(target_week_numbers)).order_by(EnabledWeek.week_number.asc()).all()

    _sync_system_config_points(db, user_id)
    return enabled_weeks



def delete_enabled_week(db: Session, db_enabled_week: EnabledWeek, user_id: str) -> None:
    """Delete one enabled week."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[1],
        description=f"Disabled week {db_enabled_week.week_number}",
        week_number=db_enabled_week.week_number
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.delete(db_enabled_week)
    db.commit()
    _sync_system_config_points(db, user_id)

def _sync_system_config_points(db: Session, user_id: str) -> None:
    from .crud_system_config import get_current_system_config, update_system_config
    
    config = get_current_system_config(db)
    if config:
        weeks = get_enabled_weeks(db)
        expected_points = len(weeks) * 3 if weeks else None
        if config.total_participation_points != expected_points:
            update_system_config(db, config, {"total_participation_points": expected_points}, user_id)

def get_max_score(db: Session, week: int) -> int:
    """Calculate the maximum possible score up to a specific week."""
    weeks = get_enabled_weeks(db)
    
    # Filter the enabled weeks up to the given week
    target_weeks = [x for x in weeks if x.week_number <= week]
    
    # Each enabled week is worth 3 points
    return len(target_weeks) * 3