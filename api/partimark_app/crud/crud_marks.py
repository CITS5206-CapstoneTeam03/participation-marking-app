from hashlib import new
from ..models.students import StudentStatus, Student
from ..models.enabled_weeks import EnabledWeek
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models.marks import ParticipationMark
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate

actions = [
    "create_mark",
    "update_mark",
    "batch_create_marks",
    "batch_update_marks",
    "delete_mark"
]

def get_mark(db: Session, mark_id: int) -> Optional[ParticipationMark]:
    """Retrieve a participation mark by its ID."""
    return db.query(ParticipationMark).filter(ParticipationMark.mark_id == mark_id).first()


def get_all_sum_marks(db: Session) -> List[Tuple[str, str, str, str, int]]:
    """Retrieve student IDs, names, and their total aggregated marks."""
    return (
        db.query(
            ParticipationMark.student_id,
            Student.first_name,
            Student.last_name,
            Student.email,
            func.sum(ParticipationMark.score).label("total")
        )
        .join(Student, ParticipationMark.student_id == Student.student_id)
        .join(EnabledWeek, ParticipationMark.week_number == EnabledWeek.week_number)
        .filter(Student.status == StudentStatus.ACTIVE)
        .group_by(
            ParticipationMark.student_id,
            Student.first_name,
            Student.last_name,
            Student.email
        )
        .all()
    )

def get_all_6w_sum_marks(db: Session) -> List[Tuple[str, str, str, str, int]]:
    """Retrieve student IDs, names, and their total aggregated marks."""
    return (
        db.query(
            ParticipationMark.student_id,
            Student.first_name,
            Student.last_name,
            Student.email,
            func.sum(ParticipationMark.score).label("total")
        )
        .join(Student, ParticipationMark.student_id == Student.student_id)
        .join(EnabledWeek, ParticipationMark.week_number == EnabledWeek.week_number)
        .filter(
            Student.status == StudentStatus.ACTIVE,
            ParticipationMark.week_number <= 6
        )
        .group_by(
            ParticipationMark.student_id,
            Student.first_name,
            Student.last_name,
            Student.email
        )
        .all()
    )


def get_marks_by_student(db: Session, student_id: str) -> List[ParticipationMark]:
    """Retrieve all participation marks for a specific student."""
    return (
        db.query(ParticipationMark)
        .filter(ParticipationMark.student_id == student_id)
        .all()
    )


def get_marks_by_workshop(db: Session, workshop_id: int) -> List[ParticipationMark]:
    """Retrieve all participation marks for a specific workshop."""
    return (
        db.query(ParticipationMark)
        .filter(ParticipationMark.workshop_id == workshop_id)
        .all()
    )


def get_marks_by_week(db: Session, week_number: int) -> List[ParticipationMark]:
    """Retrieve all participation marks for a specific enabled week."""
    return (
        db.query(ParticipationMark)
        .filter(ParticipationMark.week_number == week_number)
        .all()
    )


def get_marks_by_workshop_and_week(
    db: Session,
    workshop_id: int,
    week_number: int,
) -> List[ParticipationMark]:
    """Retrieve all participation marks for a workshop in a given week."""
    return (
        db.query(ParticipationMark)
        .filter(
            ParticipationMark.workshop_id == workshop_id,
            ParticipationMark.week_number == week_number,
        )
        .all()
    )


def get_mark_by_student_and_week(
    db: Session,
    student_id: str,
    week_number: int,
) -> Optional[ParticipationMark]:
    """Retrieve the final mark for one student in one week."""
    return (
        db.query(ParticipationMark)
        .filter(
            ParticipationMark.student_id == student_id,
            ParticipationMark.week_number == week_number,
        )
        .first()
    )


def create_mark(db: Session, mark_data: dict) -> ParticipationMark:
    """Create a single participation mark."""
    new_mark = ParticipationMark(**mark_data)

    audit_in = AuditLogCreate(
        user_id=new_mark.marked_by_user_id,
        action_type=actions[0],
        description=f"Created mark for student {new_mark.student_id}",
        student_id=new_mark.student_id,
        workshop_id=new_mark.workshop_id,
        week_number=new_mark.week_number
    )

    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(new_mark)
    db.commit()
    db.refresh(new_mark)
    return new_mark


def batch_create_marks(db: Session, marks_data: List[dict]) -> List[ParticipationMark]:
    """Efficiently create multiple marks in bulk."""
    db_marks = [ParticipationMark(**data) for data in marks_data]

    if marks_data:
        audit_in = AuditLogCreate(
            user_id=marks_data[0].get("marked_by_user_id"),
            action_type=actions[2],
            description=f"Batch created marks for workshop {marks_data[0].get('workshop_id')} in week {marks_data[0].get('week_number')}",
            workshop_id=marks_data[0].get("workshop_id"),
            week_number=marks_data[0].get("week_number")
        )
        create_audit_log(db, log_data=audit_in.model_dump())

    db.add_all(db_marks)
    db.commit()
    for mark in db_marks:
        db.refresh(mark)
    return db_marks


def update_mark(db: Session, db_mark: ParticipationMark, update_data: dict) -> ParticipationMark:
    """Update a single participation mark."""
    old_score = db_mark.score
    for key, value in update_data.items():
        if key in ("mark_id",) or value is None:
            continue
        setattr(db_mark, key, value)

    audit_in = AuditLogCreate(
        user_id=update_data.get("marked_by_user_id"),
        action_type=actions[1],
        description=f"Updated mark for student {db_mark.student_id}",
        student_id=db_mark.student_id,
        workshop_id=db_mark.workshop_id,
        week_number=db_mark.week_number,
        old_value=str(old_score),
        new_value=str(db_mark.score)
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.commit()
    db.refresh(db_mark)

    return db_mark


def batch_update_marks(
    db: Session,
    workshop_id: int,
    existing_marks: List[ParticipationMark],
    updates_data: List[dict],
) -> List[ParticipationMark]:
    """
    Efficiently update multiple marks for a specific workshop.

    Records are matched by the natural key:
    (student_id, week_number) within the given workshop context.
    """
    marks_map = {}
    for mark in existing_marks:
        key = (mark.student_id, mark.week_number)
        marks_map[key] = mark

    updated_marks = []

    for update in updates_data:
        student_id = update.get("student_id")
        week_number = update.get("week_number")

        if not student_id or week_number is None:
            continue

        key = (student_id, week_number)
        if key not in marks_map:
            continue

        db_mark = marks_map[key]
        is_changed = False

        for k, value in update.items():
            if k in ("mark_id", "student_id", "workshop_id", "week_number"):
                continue
            if value is not None and getattr(db_mark, k) != value:
                setattr(db_mark, k, value)
                is_changed = True

        if is_changed:
            updated_marks.append(db_mark)

    if updated_marks and updates_data:
        audit_in = AuditLogCreate(
            user_id=updates_data[0].get("marked_by_user_id"),
            action_type=actions[3],
            description=f"Batch updated marks for workshop {workshop_id} in week {updates_data[0].get('week_number')}",
            workshop_id=workshop_id,
            week_number=updates_data[0].get("week_number")
        )
        create_audit_log(db, log_data=audit_in.model_dump())

        db.commit()
        for mark in updated_marks:
            db.refresh(mark)

    return updated_marks


def delete_mark(db: Session, db_mark: ParticipationMark, user_id: str) -> None:
    """Delete a participation mark from the database."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[4],
        description=f"Deleted mark for student {db_mark.student_id}",
        student_id=db_mark.student_id,
        workshop_id=db_mark.workshop_id,
        week_number=db_mark.week_number,
        old_value=str(db_mark.score)
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.delete(db_mark)
    db.commit()