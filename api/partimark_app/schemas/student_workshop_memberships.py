from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


#
# 1. Base Schema
#
class StudentWorkshopMembershipBase(BaseModel):
    """Shared properties across student workshop membership schemas."""
    student_id: str = Field(..., max_length=20)
    workshop_id: int
    is_current: bool = True
    start_date: datetime
    end_date: Optional[datetime] = None
    created_by_user_id: Optional[str] = Field(None, max_length=50)


#
# 2. HTTP POST (Create)
#
class StudentWorkshopMembershipCreate(StudentWorkshopMembershipBase):
    """Properties needed to create a student workshop membership."""
    pass


#
# 3. HTTP PUT / PATCH (Update)
#
class StudentWorkshopMembershipUpdate(BaseModel):
    """
    Properties that can be updated via API.
    All fields are optional to support partial updates.
    """
    student_id: Optional[str] = Field(None, max_length=20)
    workshop_id: Optional[int] = None
    is_current: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_by_user_id: Optional[str] = Field(None, max_length=50)


#
# 4. Shared DB Properties
#
class StudentWorkshopMembershipInDBBase(StudentWorkshopMembershipBase):
    """Base schema for data returned from the database."""
    membership_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


#
# 5. HTTP GET (Response)
#
class StudentWorkshopMembershipResponse(StudentWorkshopMembershipInDBBase):
    """Schema used for API responses."""
    pass


#
# 6. Internal / DB Processing
#
class StudentWorkshopMembershipInDB(StudentWorkshopMembershipInDBBase):
    """Schema fully representing the database record internally."""
    pass