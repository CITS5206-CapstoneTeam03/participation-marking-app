from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.db import get_db
from schemas.students import StudentCreate, StudentResponse, StudentUpdate
from crud import crud_students as crud

router = APIRouter()

# Create a new student
@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    # 1. Check if student already exists
    existing_student = crud.get_student(db, student_id=student_in.student_id)
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this ID already exists."
        )

    # 2. Extract data 
    student_data = student_in.model_dump()
    
    # 3. Save to database
    new_student = crud.create_student(db, student_data=student_data)
    
    # 4. Return new student
    return new_student


# Get all students
@router.get("/", response_model=List[StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all students with pagination setup."""
    return crud.get_students(db, skip=skip, limit=limit)


# Get a specific student
@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """Retrieve a specific student by their ID."""
    student = crud.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
    return student


# Update a specific student
@router.patch("/{student_id}", response_model=StudentResponse)
def update_student(student_id: str, student_update: StudentUpdate, db: Session = Depends(get_db)):
    """
    Update student data.
    Uses PATCH methodology (only updates fields explicitly provided).
    """
    student = crud.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
    
    # exclude_unset=True makes sure we ONLY update what the client actually sent
    update_data = student_update.model_dump(exclude_unset=True)

    # Verify new email doesn't conflict with another student if they are changing it
    if "email" in update_data and update_data["email"] != student.email:
        existing_email = crud.get_student_by_email(db, email=update_data["email"])
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student with this email already exists."
            )
        
    updated_student = crud.update_student(db, db_student=student, update_data=update_data)
    return updated_student


# Delete a specific student
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: str, db: Session = Depends(get_db)):
    """Delete a student from the system."""
    student = crud.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found."
        )
    
    crud.delete_student(db, db_student=student)
    return None
