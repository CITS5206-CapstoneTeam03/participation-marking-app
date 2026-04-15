from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


#
# 1. Base Schema
#
class WorkshopBase(BaseModel):
    """Shared properties across most Workshop-related schemas."""
    workshop_name: str = Field(..., max_length=100)
    tutor_user_id: str = Field(..., max_length=50)
    is_active: bool = True


#
# 2. HTTP POST (Create)
#
class WorkshopCreate(WorkshopBase):
    """Properties needed to create a new workshop via API."""
    pass


#
# 3. HTTP PUT / PATCH (Update)
#
class WorkshopUpdate(BaseModel):
    """
    Properties that can be updated via API. 
    All fields are optional to support partial updates (PATCH methodology).
    """
    workshop_name: Optional[str] = Field(None, max_length=100)
    tutor_user_id: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


#
# 4. Shared DB Properties 
#
class WorkshopInDBBase(WorkshopBase):
    """Base schema for data returned from the database."""
    workshop_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Pydantic V2 configuration to allow parsing from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)


#
# 5. HTTP GET (Response)
#
class WorkshopResponse(WorkshopInDBBase):
    """
    Schema used for API responses. 
    """
    pass


#
# 6. Internal / DB Processing
#
class WorkshopInDB(WorkshopInDBBase):
    """
    Schema fully representing the database record internally.
    """
    pass
