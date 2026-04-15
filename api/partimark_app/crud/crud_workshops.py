from typing import List, Optional
from sqlalchemy.orm import Session
from models.workshops import Workshop

def get_workshop_by_name(db: Session, workshop_name: str) -> Optional[Workshop]:
    """Retrieve a workshop by its name."""
    return db.query(Workshop).filter(Workshop.workshop_name == workshop_name).first()

def get_workshop(db: Session, workshop_id: int) -> Optional[Workshop]:
    """Retrieve a workshop by its ID."""
    return db.query(Workshop).filter(Workshop.workshop_id == workshop_id).first()

def get_workshops(db: Session, skip: int = 0, limit: int = 100) -> List[Workshop]:
    """Retrieve all workshops with pagination."""
    return db.query(Workshop).offset(skip).limit(limit).all()

def create_workshop(db: Session, workshop_data: dict) -> Workshop:
    """Create a new workshop in the database."""
    new_workshop = Workshop(**workshop_data)
    db.add(new_workshop)
    db.commit()
    db.refresh(new_workshop)
    return new_workshop

def update_workshop(db: Session, db_workshop: Workshop, update_data: dict) -> Workshop:
    """Update an existing workshop in the database."""
    for key, value in update_data.items():
        setattr(db_workshop, key, value)
    db.commit()
    db.refresh(db_workshop)
    return db_workshop

def delete_workshop(db: Session, db_workshop: Workshop) -> None:
    """Delete a workshop from the database."""
    db.delete(db_workshop)
    db.commit()
