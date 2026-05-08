from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.users import User, UserRole
from ..crud.crud_audit_logs import create_audit_log
from ..schemas.audit_logs import AuditLogCreate


actions = [
    "create_user",
    "modify_user",
    "deactivate_user",
    "delete_user"
]

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieve a user by their email address."""
    return db.query(User).filter(User.email == email).first()


def get_user(db: Session, user_id: str) -> Optional[User]:
    """Retrieve a user by their UUID/string ID."""
    return db.query(User).filter(User.user_id == user_id).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Retrieve all users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()


def get_users_by_role(
    db: Session,
    role: UserRole,
    skip: int = 0,
    limit: int = 100,
) -> List[User]:
    """Retrieve users filtered by role."""
    return (
        db.query(User)
        .filter(User.role == role)
        .offset(skip)
        .limit(limit)
        .all()
    )


# TO DO: Remove the default user_id="UC" and require the authenticated user_id
# once the public vs admin registration flow is finalized.
def create_user(db: Session, user_data: dict, user_id: str = "UC") -> User:
    """Create a new user in the database."""
    new_user = User(**user_data)

    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[0],
        description=f"Created user {new_user.email}"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user



def update_user(db: Session, db_user: User, update_data: dict, user_id: str) -> User:
    """Update an existing user in the database."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[1],
        description=f"Modified user {db_user.email}"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    for key, value in update_data.items():
        if value is not None:
            setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user



def deactivate_user(db: Session, db_user: User, user_id: str) -> User:
    """Soft-delete/deactivate a user."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[2],
        description=f"Deactivated user {db_user.email}"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    return db_user



def delete_user(db: Session, db_user: User, user_id: str) -> None:
    """Delete a user from the database."""
    audit_in = AuditLogCreate(
        user_id=user_id,
        action_type=actions[3],
        description=f"Deleted user {db_user.email}"
    )
    create_audit_log(db, log_data=audit_in.model_dump())

    db.delete(db_user)
    db.commit()
