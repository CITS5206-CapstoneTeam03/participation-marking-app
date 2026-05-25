from datetime import UTC, datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.student_workshop_memberships import StudentWorkshopMembership
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate

actions = [
    "create_membership",
    "modify_membership",
    "delete_membership"
]

def get_membership(db: Session, membership_id: int) -> Optional[StudentWorkshopMembership]:
    """Retrieve a student workshop membership by ID."""
    return (
        db.query(StudentWorkshopMembership)
        .filter(StudentWorkshopMembership.membership_id == membership_id)
        .first()
    )


def get_memberships_by_student(
    db: Session,
    student_id: str,
) -> List[StudentWorkshopMembership]:
    """Retrieve all workshop memberships for a student."""
    return (
        db.query(StudentWorkshopMembership)
        .filter(StudentWorkshopMembership.student_id == student_id)
        .order_by(StudentWorkshopMembership.start_date.desc())
        .all()
    )


def get_current_membership_by_student(
    db: Session,
    student_id: str,
) -> Optional[StudentWorkshopMembership]:
    """Retrieve the current workshop membership for a student."""
    return (
        db.query(StudentWorkshopMembership)
        .filter(
            StudentWorkshopMembership.student_id == student_id,
            StudentWorkshopMembership.is_current.is_(True),
        )
        .first()
    )


def get_current_memberships_by_student(
    db: Session,
    student_id: str,
) -> List[StudentWorkshopMembership]:
    """Retrieve every current workshop membership for a student."""
    return (
        db.query(StudentWorkshopMembership)
        .filter(
            StudentWorkshopMembership.student_id == student_id,
            StudentWorkshopMembership.is_current.is_(True),
        )
        .all()
    )


def get_current_memberships_by_workshop(
    db: Session,
    workshop_id: int,
) -> List[StudentWorkshopMembership]:
    """Retrieve all current student memberships for a workshop."""
    return (
        db.query(StudentWorkshopMembership)
        .filter(
            StudentWorkshopMembership.workshop_id == workshop_id,
            StudentWorkshopMembership.is_current.is_(True),
        )
        .all()
    )


def create_membership(
    db: Session,
    membership_data: dict,
    user_id: str = "LogicApp"
) -> StudentWorkshopMembership:
    """Create a new student workshop membership."""
    membership = StudentWorkshopMembership(**membership_data)

    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[0],
        description=f"Created membership for student {membership.student_id} in workshop {membership.workshop_id}",
        student_id=membership.student_id,
        workshop_id=membership.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def update_membership(
    db: Session,
    db_membership: StudentWorkshopMembership,
    update_data: dict,
    user_id: str = "ADMIN"
) -> StudentWorkshopMembership:
    """Update an existing student workshop membership."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[1],
        description=f"Modified membership for student {db_membership.student_id}",
        student_id=db_membership.student_id,
        workshop_id=db_membership.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    for key, value in update_data.items():
        if value is not None:
            setattr(db_membership, key, value)
    db.commit()
    db.refresh(db_membership)
    return db_membership


def close_current_membership(
    db: Session,
    db_membership: StudentWorkshopMembership,
    end_date: Optional[datetime] = None,
    user_id: str = "ADMIN"
) -> StudentWorkshopMembership:
    """Mark the current membership as no longer current."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[1],
        description=f"Closed current membership for student {db_membership.student_id}",
        student_id=db_membership.student_id,
        workshop_id=db_membership.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db_membership.is_current = False
    db_membership.end_date = end_date or datetime.now(UTC)
    db.commit()
    db.refresh(db_membership)
    return db_membership


def move_student_to_workshop(
    db: Session,
    student_id: str,
    target_workshop_id: int,
    created_by_user_id: Optional[str] = None,
    move_time: Optional[datetime] = None,
) -> StudentWorkshopMembership:
    """
    Move a student to a new workshop while preserving membership history.

    This closes the current membership (if any) and creates a new current membership.
    """
    move_time = move_time or datetime.now(UTC)

    current_memberships = get_current_memberships_by_student(db, student_id)
    if any(
        membership.workshop_id == target_workshop_id
        for membership in current_memberships
    ):
        raise ValueError("Student is already assigned to the target workshop.")

    for current_membership in current_memberships:
        current_membership.is_current = False
        current_membership.end_date = move_time

    new_membership = StudentWorkshopMembership(
        student_id=student_id,
        workshop_id=target_workshop_id,
        is_current=True,
        start_date=move_time,
        end_date=None,
        created_by_user_id=created_by_user_id,
    )

    audit_in = AuditLogCreate(
        user_id=created_by_user_id or "ADMIN",
        action_type=actions[0],
        description=f"Moved student {student_id} to workshop {target_workshop_id}",
        student_id=student_id,
        workshop_id=target_workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)
    return new_membership


def delete_membership(db: Session, db_membership: StudentWorkshopMembership, user_id: str = "ADMIN") -> None:
    """Delete a student workshop membership."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[2],
        description=f"Deleted membership for student {db_membership.student_id}",
        student_id=db_membership.student_id,
        workshop_id=db_membership.workshop_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.delete(db_membership)
    db.commit()
