from typing import List, Optional
from sqlalchemy.orm import Session
from models.users import User

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieve a user by their email address."""
    return db.query(User).filter(User.email == email).first()

def get_user(db: Session, user_id: str) -> Optional[User]:
    """Retrieve a user by their UUID."""
    return db.query(User).filter(User.user_id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Retrieve all users with pagination."""
    return db.query(User).offset(skip).limit(limit).all()

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
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, db_user: User) -> None:
    """Delete a user from the database."""
    db.delete(db_user)
    db.commit()
