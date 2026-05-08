from typing import List

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....db.db import get_db #type:ignore
from ....schemas.users import UserCreate, UserResponse, UserUpdate #type:ignore
from ....crud import crud_users as crud #type:ignore
from ....core.deps import get_current_user #type:ignore
from ....models.users import User, UserRole #type:ignore

router = APIRouter()


# TO DO: Clarify if user registration should be public or Admin-only.
# Currently, this is locked to Admin-only (Scenario A: closed system).
# If the system requires Open Registration (Scenario B), we MUST:
# 1. Remove the `current_user` authentication requirement so anyone can reach it.
# 2. Hardcode the assigned role to `UserRole.TUTOR` and ignore the payload's `role`
#    to prevent malicious privilege escalation (i.e. passing {"role": "admin"}).
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists.",
        )

    user_data = user_in.model_dump(exclude={"password"})
    user_data["hashed_password"] = user_in.get_hashed_password()

    new_user = crud.create_user(db, user_data=user_data)
    return new_user


@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can view the full user list.",
        )
    return crud.get_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's profile.",
        )

    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN and current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's profile.",
        )

    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    update_data = user_update.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != user.email:
        existing_user = crud.get_user_by_email(db, email=update_data["email"])
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists.",
            )

    if "password" in update_data:
        raw_password = update_data.pop("password")
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(raw_password.encode("utf-8"), salt).decode("utf-8")
        update_data["hashed_password"] = hashed_password

    updated_user = crud.update_user(db, db_user=user, update_data=update_data, user_id=current_user.user_id)
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can delete users.",
        )

    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    crud.delete_user(db, db_user=user, user_id=current_user.user_id)
    return None