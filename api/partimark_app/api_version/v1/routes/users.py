from typing import List

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.db import get_db
from schemas.users import UserCreate, UserResponse, UserUpdate
from crud import crud_users as crud

router = APIRouter(prefix="/users", tags=["Users"])

# Create a new user
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    existing_user = crud.get_user_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    # 2. Extract data & hash password utilizing our new schema helper
    user_data = user_in.model_dump(exclude={"password"})  # remove cleartext password
    user_data["hashed_password"] = user_in.get_hashed_password()
    
    # 3. Save to database
    new_user = crud.create_user(db, user_data=user_data)
    
    # 4. Return new user (FastAPI automatically uses UserResponse to filter out the password)
    return new_user


# Get all users
@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all users with pagination setup."""
    return crud.get_users(db, skip=skip, limit=limit)


# Get a specific user
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Retrieve a specific user by their UUID."""
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    return user


# Update a specific user
@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    """
    Update user profile data.
    Uses PATCH methodology (only updates fields explicitly provided).
    """
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    # exclude_unset=True makes sure we ONLY update what the client actually sent
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Check if we need to update the password specifically
    if "password" in update_data:
        raw_password = update_data.pop("password")
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(raw_password.encode('utf-8'), salt).decode('utf-8')
        update_data["hashed_password"] = hashed_password
        
    updated_user = crud.update_user(db, db_user=user, update_data=update_data)
    return updated_user


# Delete a specific user
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    """Delete a user from the system."""
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    crud.delete_user(db, db_user=user)
    return None
