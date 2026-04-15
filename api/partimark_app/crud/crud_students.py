from typing import List, Optional
from sqlalchemy.orm import Session
from models.students import Student

def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    """Retrieve a student by their email address."""
    return db.query(Student).filter(Student.email == email).first()

def get_student(db: Session, student_id: str) -> Optional[Student]:
    """Retrieve a student by their ID."""
    return db.query(Student).filter(Student.student_id == student_id).first()

def get_students(db: Session, skip: int = 0, limit: int = 100) -> List[Student]:
    """Retrieve all students with pagination."""
    return db.query(Student).offset(skip).limit(limit).all()

def create_student(db: Session, student_data: dict) -> Student:
    """Create a new student in the database."""
    new_student = Student(**student_data)
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

def update_student(db: Session, db_student: Student, update_data: dict) -> Student:
    """Update an existing student in the database."""
    for key, value in update_data.items():
        setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    return db_student

def delete_student(db: Session, db_student: Student) -> None:
    """Delete a student from the database."""
    db.delete(db_student)
    db.commit()
