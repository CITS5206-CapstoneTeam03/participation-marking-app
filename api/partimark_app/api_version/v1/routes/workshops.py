from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.db import get_db
from schemas.workshops import WorkshopCreate, WorkshopResponse, WorkshopUpdate
from crud import crud_workshops as crud

router = APIRouter()

# Create a new workshop
@router.post("/", response_model=WorkshopResponse, status_code=status.HTTP_201_CREATED)
def create_workshop(workshop_in: WorkshopCreate, db: Session = Depends(get_db)):
    # 1. Check if workshop already exists
    existing_workshop = crud.get_workshop_by_name(db, workshop_name=workshop_in.workshop_name)
    if existing_workshop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workshop with this name already exists."
        )

    # 2. Extract data (no passwords to hash here)
    workshop_data = workshop_in.model_dump()
    
    # 3. Save to database
    new_workshop = crud.create_workshop(db, workshop_data=workshop_data)
    
    # 4. Return new workshop
    return new_workshop


# Get all workshops
@router.get("/", response_model=List[WorkshopResponse])
def get_workshops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all workshops with pagination setup."""
    return crud.get_workshops(db, skip=skip, limit=limit)


# Get a specific workshop
@router.get("/{workshop_id}", response_model=WorkshopResponse)
def get_workshop(workshop_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific workshop by its ID."""
    workshop = crud.get_workshop(db, workshop_id=workshop_id)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found."
        )
    return workshop


# Update a specific workshop
@router.patch("/{workshop_id}", response_model=WorkshopResponse)
def update_workshop(workshop_id: int, workshop_update: WorkshopUpdate, db: Session = Depends(get_db)):
    """
    Update workshop data.
    Uses PATCH methodology (only updates fields explicitly provided).
    """
    workshop = crud.get_workshop(db, workshop_id=workshop_id)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found."
        )
    
    # exclude_unset=True makes sure we ONLY update what the client actually sent
    update_data = workshop_update.model_dump(exclude_unset=True)
        
    updated_workshop = crud.update_workshop(db, db_workshop=workshop, update_data=update_data)
    return updated_workshop


# Delete a specific workshop
@router.delete("/{workshop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workshop(workshop_id: int, db: Session = Depends(get_db)):
    """Delete a workshop from the system."""
    workshop = crud.get_workshop(db, workshop_id=workshop_id)
    if not workshop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workshop not found."
        )
    
    crud.delete_workshop(db, db_workshop=workshop)
    return None
