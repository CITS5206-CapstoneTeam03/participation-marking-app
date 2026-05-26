from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....db.db import get_db #type:ignore
from ....schemas.students import StudentResponse #type:ignore
from ....schemas.workshops import WorkshopCreate, WorkshopResponse, WorkshopUpdate #type:ignore
from ....crud import crud_student_workshop_memberships as crud_memberships #type:ignore
from ....crud import crud_workshops as crud_workshops #type:ignore
from ....crud import crud_users as crud_users #type:ignore
from ....core.deps import get_current_user #type:ignore
from ....models.users import User #type:ignore

router = APIRouter()


_MISSING = object()


def apply_tutor_email(db: Session, workshop_data: dict) -> None:
    tutor_email = workshop_data.pop("tutor_email", _MISSING)
    if tutor_email is _MISSING:
        return

    trimmed_email = tutor_email.strip() if tutor_email else ""
    if not trimmed_email:
        workshop_data["tutor_user_id"] = None
        return

    tutor = crud_users.get_user_by_email(db, trimmed_email)
    if not tutor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned tutor email does not exist.",
        )
    workshop_data["tutor_user_id"] = tutor.user_id


@router.post("/", response_model=WorkshopResponse, status_code=status.HTTP_201_CREATED)
def create_workshop(
    workshop_in: WorkshopCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_workshop = crud_workshops.get_workshop_by_name(
        db, workshop_name=workshop_in.workshop_name
    )
    if existing_workshop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workshop with this name already exists.",
        )

    workshop_data = workshop_in.model_dump()
    apply_tutor_email(db, workshop_data)

    if workshop_data.get("tutor_user_id"):
        tutor = crud_users.get_user(db, workshop_data["tutor_user_id"])
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned tutor_user_id does not exist.",
            )

    new_workshop = crud_workshops.create_workshop(db, workshop_data=workshop_data, user_id=current_user.user_id)
    return new_workshop


@router.get("/", response_model=List[WorkshopResponse])
def get_workshops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_workshops.get_workshops(db, skip=skip, limit=limit)


@router.get("/students/{workshop_id}", response_model=List[StudentResponse])
def get_workshop_students(workshop_id: int, db: Session = Depends(get_db)):
    workshop = crud_workshops.get_workshop(db, workshop_id=workshop_id)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found.",
        )

    memberships = crud_memberships.get_current_memberships_by_workshop(
        db,
        workshop_id=workshop_id,
    )
    return [membership.student for membership in memberships]


@router.get("/{workshop_id}", response_model=WorkshopResponse)
def get_workshop(workshop_id: int, db: Session = Depends(get_db)):
    workshop = crud_workshops.get_workshop(db, workshop_id=workshop_id)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found.",
        )
    return workshop


@router.patch("/{workshop_id}", response_model=WorkshopResponse)
def update_workshop(
    workshop_id: int,
    workshop_update: WorkshopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workshop = crud_workshops.get_workshop(db, workshop_id=workshop_id)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found.",
        )

    update_data = workshop_update.model_dump(exclude_unset=True)
    apply_tutor_email(db, update_data)

    if "workshop_name" in update_data and update_data["workshop_name"] != workshop.workshop_name:
        existing_workshop = crud_workshops.get_workshop_by_name(
            db, workshop_name=update_data["workshop_name"]
        )
        if existing_workshop:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workshop with this name already exists.",
            )

    if "tutor_user_id" in update_data and update_data["tutor_user_id"] is not None:
        tutor = crud_users.get_user(db, update_data["tutor_user_id"])
        if not tutor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned tutor_user_id does not exist.",
            )

    updated_workshop = crud_workshops.update_workshop(
        db, db_workshop=workshop, update_data=update_data, user_id=current_user.user_id
    )
    return updated_workshop


@router.delete("/{workshop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workshop(
    workshop_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workshop = crud_workshops.get_workshop(db, workshop_id=workshop_id)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found.",
        )

    crud_workshops.delete_workshop(db, db_workshop=workshop, user_id=current_user.user_id)
    return None
