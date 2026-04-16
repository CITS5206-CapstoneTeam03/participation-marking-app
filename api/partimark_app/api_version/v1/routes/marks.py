from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.db import get_db
from schemas.marks import MarkCreate, MarkResponse, MarkUpdate
from crud import crud_marks as crud

router = APIRouter()

# Create a new mark
@router.post("/", response_model=MarkResponse, status_code=status.HTTP_201_CREATED)
def create_mark(mark_in: MarkCreate, db: Session = Depends(get_db)):
    # Extract data 
    mark_data = mark_in.model_dump()
    
    # TODO: Once the Config/Semester model is built, you should validate the semester_id here 
    # to ensure marks are not created for inactive or non-existent semesters.
    
    # Save to database
    new_mark = crud.create_mark(db, mark_data=mark_data)
    return new_mark


# Get all marks for a specific workshop
# TODO: Update this route to include semester_id (e.g. /{semester_id}/{workshop_id}) when Config model is built.
@router.get("/{workshop_id}", response_model=List[MarkResponse])
def get_marks_by_workshop(workshop_id: int, db: Session = Depends(get_db)):
    """Retrieve all participation marks for a specific workshop."""
    # TODO: Pass semester_id parameter to crud.get_marks_by_workshop once implemented.
    marks = crud.get_marks_by_workshop(db, workshop_id=workshop_id)
    return marks


# Batch Update all marks for a specific workshop
# TODO: Update this route path to include /{semester_id}/workshops/{workshop_id}/batch or pass semester_id as a query param when Config model is ready.
@router.put("/{workshop_id}/batch", response_model=List[MarkResponse])
def batch_update_workshop_marks(workshop_id: int, marks_in: List[MarkUpdate], db: Session = Depends(get_db)):
    """
    Mass update route. Receives a list of student marks and efficiently applies changes
    all at once via the underlying CRUD service.
    """
    # 1. Fetch exactly what currently exists for this specific workshop
    # TODO: Add semester_id parameter to crud.get_marks_by_workshop once implemented
    existing_marks = crud.get_marks_by_workshop(db, workshop_id=workshop_id)
    
    if not existing_marks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No existing marks found to update for workshop {workshop_id}."
        )

    # 2. Iterate through incoming objects to extract parameters safely for the bulk updater
    updates_data = [mark.model_dump(exclude_unset=True) for mark in marks_in]
    
    # 3. Pipe it securely through the CRUD layer which enforces workshop_id constraints
    # TODO: Pass semester_id into batch_update_marks here once available in context
    updated_records = crud.batch_update_marks(
        db=db,
        workshop_id=workshop_id,
        existing_marks=existing_marks,
        updates_data=updates_data
    )
    
    return updated_records


# Delete a specific mark
@router.delete("/{mark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mark(mark_id: int, db: Session = Depends(get_db)):
    """Delete a participation mark from the system."""
    mark = crud.get_mark(db, mark_id=mark_id)
    if not mark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mark not found."
        )
    
    crud.delete_mark(db, db_mark=mark)
    return None
