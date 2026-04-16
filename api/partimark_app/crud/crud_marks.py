from typing import List, Optional
from sqlalchemy.orm import Session
from models.marks import ParticipationMark

def get_mark(db: Session, mark_id: int) -> Optional[ParticipationMark]:
    """Retrieve a participation mark by its ID."""
    return db.query(ParticipationMark).filter(ParticipationMark.mark_id == mark_id).first()

def get_all_marks_by_semester(
    db: Session, 
    # TODO: Add semester_id parameter once the Config model is built.
    # semester_id: int
) -> List[ParticipationMark]:
    """Retrieve all marks for all students in a given semester."""
    # TODO: Apply semester_id filter to the query here once available.
    # query = query.filter(ParticipationMark.semester_id == semester_id)
    
    return []

# TODO: Add semester_id parameter once the Config model is built to ensure strict filtering.
def get_marks_by_workshop(db: Session, workshop_id: int) -> List[ParticipationMark]:
    """Retrieve all participation marks for a specific workshop."""
    # TODO: Add .filter(ParticipationMark.semester_id == semester_id) to the query below.
    return db.query(ParticipationMark).filter(ParticipationMark.workshop_id == workshop_id).all()

def batch_create_marks(db: Session, marks_data: List[dict]) -> List[ParticipationMark]:
    """Efficiently create multiple marks in bulk."""
    # TODO: Verify or inject semester_id into each item inside marks_data here when Config model is implemented.
    db_marks = [ParticipationMark(**data) for data in marks_data]
    db.add_all(db_marks)
    db.commit()
    # Note: explicit refresh is often omitted in extreme bulk scaling, but fine here.
    for mark in db_marks:
        db.refresh(mark)
    return db_marks

def batch_update_marks(db: Session, workshop_id: int, existing_marks: List[ParticipationMark], updates_data: List[dict]) -> List[ParticipationMark]:
    """
    Efficiently update multiple marks for a specific workshop.
    Follows industry best practice: checks for actual changes before updating to avoid unnecessary DB flushes.
    Identifies records using natural keys rather than requiring the frontend to track mark_id.
    """
    # Create a mapping of existing marks based on their composite natural keys.
    # TODO: Add semester_id parameter to function and to this composite key mapping when the Config model is implemented.
    # The composite key is currently: (student_id, week_number) since workshop_id is enforced via the function parameter.
    marks_map = {}
    for mark in existing_marks:
        key = (mark.student_id, mark.week_number)
        marks_map[key] = mark

    updated_marks = []
    
    for update in updates_data:
        student_id = update.get("student_id")
        week_number = update.get("week_number")
        
        # We need these two fields to accurately map the update to the correct existing mark within this specific workshop.
        if not student_id or not week_number:
            continue
            
        key = (student_id, week_number)
        if key not in marks_map:
            continue
            
        db_mark = marks_map[key]
        is_changed = False
        
        # Apply the fields from the update dictionary
        for k, value in update.items():
            # Skip the identifying keys since they define the record and shouldn't be altered natively.
            # TODO: add "semester_id" to the skipped tuple below when introduced.
            if k in ("mark_id", "student_id", "workshop_id", "week_number", "semester_id"):
                continue
            if getattr(db_mark, k) != value:
                setattr(db_mark, k, value)
                is_changed = True
                
        if is_changed:
            updated_marks.append(db_mark)
            
    if updated_marks:
        db.commit()
        for mark in updated_marks:
            db.refresh(mark)
            
    return updated_marks

def delete_mark(db: Session, db_mark: ParticipationMark) -> None:
    """Delete a participation mark from the database."""
    db.delete(db_mark)
    db.commit()
