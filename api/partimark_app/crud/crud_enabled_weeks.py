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

#TO DO: replace user ID with the one in auth payload, will do after merge

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


def create_enabled_week(db: Session, week_data: dict, user_id: str = "UC") -> EnabledWeek:
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
    return enabled_week



def create_enabled_weeks_bulk(db: Session, weeks_data: List[dict], user_id: str = "UC") -> List[EnabledWeek]:
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
    return enabled_weeks



def replace_enabled_weeks(db: Session, week_numbers: List[int], user_id: str = "UC") -> List[EnabledWeek]:
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

    db.query(EnabledWeek).delete()
    db.commit()

    enabled_weeks = [EnabledWeek(week_number=week_number) for week_number in sorted(set(week_numbers))]
    db.add_all(enabled_weeks)
    db.commit()

    for week in enabled_weeks:
        db.refresh(week)

    return enabled_weeks



def delete_enabled_week(db: Session, db_enabled_week: EnabledWeek, user_id: str = "UC") -> None:
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
