from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


#
# 1. Base Schema
#
class MarkBase(BaseModel):
    """Shared properties across most Participation Mark-related schemas."""
    student_id: str = Field(..., max_length=20)
    workshop_id: int
    week_number: int = Field(..., ge=1, description="The enabled teaching week number")
    score: int = Field(..., ge=0, le=3, description="Participation score from 0 to 3")
    marked_by_user_id: str = Field(..., max_length=50)


#
# 2. HTTP POST (Create)
#
class MarkCreate(MarkBase):
    """Properties needed to create a new mark via API."""
    pass


#
# 3. HTTP PUT / PATCH (Update)
#
class MarkUpdate(BaseModel):
    """
    Properties that can be updated via API.
    All fields are optional to support partial updates (PATCH methodology).
    """
    student_id: Optional[str] = Field(None, max_length=20)
    workshop_id: Optional[int] = None
    week_number: Optional[int] = Field(None, ge=1)
    score: Optional[int] = Field(None, ge=0, le=3)
    marked_by_user_id: Optional[str] = Field(None, max_length=50)


#
# 4. Shared DB Properties
#
class MarkInDBBase(MarkBase):
    """Base schema for data returned from the database."""
    mark_id: int
    marked_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


#
# 5. HTTP GET (Response)
#
class MarkResponse(MarkInDBBase):
    """Schema used for API responses."""
    pass


#
# 6. Internal / DB Processing
#
class MarkInDB(MarkInDBBase):
    """Schema fully representing the database record internally."""
    pass

#
# 7. For Batch API Endpoint (Workshop Detail View)
#
class MarkBatchRequestItem(BaseModel):
    """Schema for a single student's mark when submitting a batch."""
    student_id: str = Field(..., max_length=20)
    score: int = Field(..., ge=0, le=3)

class MarkBatchRequest(BaseModel):
    """Schema for the complete batch request."""
    marked_by_user_id: str = Field(..., max_length=50)
    marks: List[MarkBatchRequestItem]