from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.students import Student, StudentStatus
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate


actions = [
    "create_student",
    "update_student_status",
    "modify_student_info",
    "delete_student"
]

def _resolve_user_id(db: Session, user_id: str) -> str:
    if user_id in ("ADMIN", "LogicApp"):
        from ..models.users import User, UserRole
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if admin:
            return admin.user_id
    return user_id

def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    """Retrieve a student by their email address."""
    return db.query(Student).filter(Student.email == email).first()


def get_student(db: Session, student_id: str) -> Optional[Student]:
    """Retrieve a student by their ID."""
    return db.query(Student).filter(Student.student_id == student_id).first()


def get_students(db: Session, skip: int = 0, limit: int = 100) -> List[Student]:
    """Retrieve all students with pagination."""
    return db.query(Student).offset(skip).limit(limit).all()


def get_students_by_status(
    db: Session,
    status: StudentStatus,
    skip: int = 0,
    limit: int = 100,
) -> List[Student]:
    """Retrieve students filtered by status."""
    return (
        db.query(Student)
        .filter(Student.status == status)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_student(db: Session, student_data: dict, user_id: str = "LogicApp") -> Student:
    """Create a new student in the database."""
    new_student = Student(**student_data)

    audit_in = AuditLogCreate(
        user_id=_resolve_user_id(db, user_id),
        action_type=actions[0],
        description=f"Created student {new_student.student_id}",
        student_id=new_student.student_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student



def update_student(db: Session, db_student: Student, update_data: dict, user_id: str) -> Student:
    """Update an existing student in the database."""
    audit_in = AuditLogCreate(
        user_id=_resolve_user_id(db, user_id),
        action_type=actions[2],
        description=f"Updated student info for {db_student.student_id}",
        student_id=db_student.student_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    for key, value in update_data.items():
        if value is not None:
            setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    return db_student



def withdraw_student(db: Session, db_student: Student, user_id: str) -> Student:
    """Mark a student as withdrawn instead of deleting the record."""
    audit_in = AuditLogCreate(
        user_id=_resolve_user_id(db, user_id),
        action_type=actions[1],
        description=f"Withdrew student {db_student.student_id}",
        student_id=db_student.student_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db_student.status = StudentStatus.WITHDRAWN
    db.commit()
    db.refresh(db_student)
    return db_student



def reactivate_student(db: Session, db_student: Student, user_id: str) -> Student:
    """Mark a withdrawn student back to active if needed."""
    audit_in = AuditLogCreate(
        user_id=_resolve_user_id(db, user_id),
        action_type=actions[1],
        description=f"Reactivated student {db_student.student_id}",
        student_id=db_student.student_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db_student.status = StudentStatus.ACTIVE
    db.commit()
    db.refresh(db_student)
    return db_student



def delete_student(db: Session, db_student: Student, user_id: str) -> None:
    """Delete a student from the database."""
    audit_in = AuditLogCreate(
        user_id=_resolve_user_id(db, user_id),
        action_type=actions[3],
        description=f"Deleted student {db_student.student_id}",
        student_id=db_student.student_id
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.delete(db_student)
    db.commit()
