from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.workshops import Workshop
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate

#TO DO: update user ID when merge PR, retrieve user_id from auth payload

actions = [
    "create_workshop",
    "modify_workshop",
    "deactivate_workshop",
    "delete_workshop"
]

def get_workshop_by_name(db: Session, workshop_name: str) -> Optional[Workshop]:
    """Retrieve a workshop by its name."""
    return db.query(Workshop).filter(Workshop.workshop_name == workshop_name).first()


def get_workshop(db: Session, workshop_id: int) -> Optional[Workshop]:
    """Retrieve a workshop by its ID."""
    return db.query(Workshop).filter(Workshop.workshop_id == workshop_id).first()


def get_workshops(db: Session, skip: int = 0, limit: int = 100) -> List[Workshop]:
    """Retrieve all workshops with pagination."""
    return db.query(Workshop).offset(skip).limit(limit).all()


def get_workshops_by_tutor(
    db: Session,
    tutor_user_id: str,
    skip: int = 0,
    limit: int = 100,
) -> List[Workshop]:
    """Retrieve workshops assigned to a specific tutor/UC acting as tutor."""
    return (
        db.query(Workshop)
        .filter(Workshop.tutor_user_id == tutor_user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_workshop(db: Session, workshop_data: dict, user_id: str) -> Workshop:
    """Create a new workshop in the database."""
    new_workshop = Workshop(**workshop_data)

    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[0],
        description=f"Created workshop {new_workshop.workshop_name}",
        workshop_id=new_workshop.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(new_workshop)
    db.commit()
    db.refresh(new_workshop)
    return new_workshop


def update_workshop(db: Session, db_workshop: Workshop, update_data: dict, user_id: str) -> Workshop:
    """Update an existing workshop in the database."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[1],
        description=f"Modified workshop {db_workshop.workshop_name}",
        workshop_id=db_workshop.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    for key, value in update_data.items():
        if value is not None:
            setattr(db_workshop, key, value)
    db.commit()
    db.refresh(db_workshop)
    return db_workshop


def deactivate_workshop(db: Session, db_workshop: Workshop, user_id: str) -> Workshop:
    """Soft-delete/deactivate a workshop."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[2],
        description=f"Deactivated workshop {db_workshop.workshop_name}",
        workshop_id=db_workshop.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db_workshop.is_active = False
    db.commit()
    db.refresh(db_workshop)
    return db_workshop


def delete_workshop(db: Session, db_workshop: Workshop, user_id: str) -> None:
    """Delete a workshop from the database."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[3],
        description=f"Deleted workshop {db_workshop.workshop_name}",
        workshop_id=db_workshop.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.delete(db_workshop)
    db.commit()
