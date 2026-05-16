from typing import List, Optional

from sqlalchemy.orm import Session

from ..models.users import User, UserRole


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


def create_user(db: Session, user_data: dict) -> User:
    """Create a new user in the database."""
    new_user = User(**user_data)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user(db: Session, db_user: User, update_data: dict) -> User:
    """Update an existing user in the database."""
    for key, value in update_data.items():
        if value is not None:
            setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def deactivate_user(db: Session, db_user: User) -> User:
    """Soft-delete/deactivate a user."""
    db_user.is_active = False
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, db_user: User) -> None:
    """Delete a user from the database."""
    db.delete(db_user)
    db.commit()


def get_user_by_reset_token_hash(db: Session, token_hash: str) -> Optional[User]:
    """Look up a user by their stored password-reset token hash."""
    return (
        db.query(User)
        .filter(User.password_reset_token_hash == token_hash)
        .first()
    )


def set_reset_token(
    db: Session,
    db_user: User,
    token_hash: str,
    expires_at,
) -> User:
    """Persist the hashed reset token and its expiry on the user record."""
    db_user.password_reset_token_hash = token_hash
    db_user.password_reset_token_expires_at = expires_at
    db.commit()
    db.refresh(db_user)
    return db_user


def clear_reset_token(db: Session, db_user: User) -> User:
    """Invalidate the one-time token after it has been consumed."""
    db_user.password_reset_token_hash = None
    db_user.password_reset_token_expires_at = None
    db.commit()
    db.refresh(db_user)
    return db_user