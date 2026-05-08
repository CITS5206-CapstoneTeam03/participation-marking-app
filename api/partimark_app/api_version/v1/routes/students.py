from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ....db.db import get_db #type:ignore
from ....schemas.students import StudentCreate, StudentResponse, StudentUpdate #type:ignore
from ....crud import crud_students as crud_students  # type: ignore
from ....crud import crud_student_workshop_memberships as crud_memberships  # type: ignore
from ....crud import crud_workshops as crud_workshops  # type: ignore
from ....core.deps import get_current_user #type: ignore
from ....models.users import User #type: ignore
router = APIRouter()


class MoveStudentRequest(BaseModel):
    target_workshop_id: int
    created_by_user_id: Optional[str] = Field(None, max_length=50)


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_in: StudentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_student = crud_students.get_student(db, student_id=student_in.student_id)
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this ID already exists.",
        )

    existing_email = crud_students.get_student_by_email(db, email=student_in.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this email already exists.",
        )

    student_data = student_in.model_dump()
    new_student = crud_students.create_student(db, student_data=student_data, user_id=current_user.user_id)
    return new_student


@router.get("/", response_model=List[StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_students.get_students(db, skip=skip, limit=limit)


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    student = crud_students.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )
    return student


@router.patch("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: str,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = crud_students.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    update_data = student_update.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != student.email:
        existing_email = crud_students.get_student_by_email(db, email=update_data["email"])
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student with this email already exists.",
            )

    updated_student = crud_students.update_student(
        db, db_student=student, update_data=update_data, user_id=current_user.user_id
    )
    return updated_student


@router.patch("/{student_id}/withdraw", response_model=StudentResponse)
def withdraw_student(
    student_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = crud_students.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    withdrawn_student = crud_students.withdraw_student(db, db_student=student, user_id=current_user.user_id)
    return withdrawn_student


@router.post("/{student_id}/move", status_code=status.HTTP_200_OK)
def move_student(
    student_id: str,
    move_request: MoveStudentRequest,
    db: Session = Depends(get_db),
):
    student = crud_students.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    target_workshop = crud_workshops.get_workshop(db, move_request.target_workshop_id)
    if not target_workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target workshop not found.",
        )

    current_memberships = crud_memberships.get_current_memberships_by_student(
        db,
        student_id=student_id,
    )
    if any(
        membership.workshop_id == move_request.target_workshop_id
        for membership in current_memberships
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is already assigned to the target workshop.",
        )

    try:
        new_membership = crud_memberships.move_student_to_workshop(
            db=db,
            student_id=student_id,
            target_workshop_id=move_request.target_workshop_id,
            created_by_user_id=move_request.created_by_user_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return {
        "message": "Student moved successfully.",
        "membership_id": new_membership.membership_id,
        "student_id": new_membership.student_id,
        "workshop_id": new_membership.workshop_id,
        "is_current": new_membership.is_current,
        "previous_workshop_ids": [
            membership.workshop_id for membership in current_memberships
        ],
    }


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = crud_students.get_student(db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    crud_students.delete_student(db, db_student=student, user_id=current_user.user_id)
    return None
