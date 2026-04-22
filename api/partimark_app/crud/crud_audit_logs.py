from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.audit_logs import AuditLog


def get_audit_log(db: Session, audit_log_id: int) -> Optional[AuditLog]:
    """Retrieve one audit log by ID."""
    return (
        db.query(AuditLog)
        .filter(AuditLog.audit_log_id == audit_log_id)
        .first()
    )


def get_audit_logs(db: Session, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    """Retrieve audit logs ordered by newest first."""
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_audit_logs_by_user(
    db: Session,
    user_id: str,
    skip: int = 0,
    limit: int = 100,
) -> List[AuditLog]:
    """Retrieve audit logs created by a specific user."""
    return (
        db.query(AuditLog)
        .filter(AuditLog.user_id == user_id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_audit_logs_by_student(
    db: Session,
    student_id: str,
    skip: int = 0,
    limit: int = 100,
) -> List[AuditLog]:
    """Retrieve audit logs related to a specific student."""
    return (
        db.query(AuditLog)
        .filter(AuditLog.student_id == student_id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_audit_logs_by_workshop(
    db: Session,
    workshop_id: int,
    skip: int = 0,
    limit: int = 100,
) -> List[AuditLog]:
    """Retrieve audit logs related to a specific workshop."""
    return (
        db.query(AuditLog)
        .filter(AuditLog.workshop_id == workshop_id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_audit_logs_by_action_type(
    db: Session,
    action_type: str,
    skip: int = 0,
    limit: int = 100,
) -> List[AuditLog]:
    """Retrieve audit logs filtered by action type."""
    return (
        db.query(AuditLog)
        .filter(AuditLog.action_type == action_type)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_audit_log(db: Session, log_data: dict) -> AuditLog:
    """Create an audit log entry."""
    audit_log = AuditLog(**log_data)
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def delete_audit_log(db: Session, db_log: AuditLog) -> None:
    """Delete an audit log entry."""
    db.delete(db_log)
    db.commit()