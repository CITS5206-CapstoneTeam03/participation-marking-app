from typing import List

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from ....db.db import get_db #type:ignore
from ....schemas.users import UserResponse, UserSelfUpdate #type:ignore
from ....crud import crud_users as crud #type:ignore
from ....core.deps import get_current_user #type:ignore
from ....models.users import User #type:ignore

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_users(db, skip=skip, limit=limit)


@router.get("/me", response_model=UserResponse, summary="Get your own profile")
def get_own_profile(current_user: User = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return current_user


@router.get("/{user_id}", response_model=UserResponse, summary="Get a user by ID")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/me", response_model=UserResponse, summary="Update your own profile")
def update_own_profile(
    user_update: UserSelfUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Allows an authenticated user to update their own name / display name.
    Email, role, is_active, and password are intentionally blocked here —
    those are admin-only fields managed via the admin panel.
    """
    update_data = user_update.model_dump(exclude_unset=True)
    return crud.update_user(db, db_user=current_user, update_data=update_data)
