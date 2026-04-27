from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


#
# 1. Base Schema
#
class StudentBase(BaseModel):
    """Shared properties across most Student-related schemas."""
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    email: EmailStr

    # Removed max_length so the MVP can store a base64 data URL for manual photo matching.
    image_url: Optional[str] = None

    status: Literal["active", "withdrawn"] = Field(
        default="active",
        description="The current status of the student",
    )


#
# 2. HTTP POST (Create)
#
class StudentCreate(StudentBase):
    """Properties needed to create a new student via API."""
    student_id: str = Field(..., max_length=20, description="The unique predefined student ID.")


#
# 3. HTTP PUT / PATCH (Update)
#
class StudentUpdate(BaseModel):
    """
    Properties that can be updated via API.
    All fields are optional to support partial updates (PATCH methodology).
    """
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    image_url: Optional[str] = None
    status: Optional[Literal["active", "withdrawn"]] = Field(
        None,
        description="The current status of the student",
    )


#
# 4. Shared DB Properties
#
class StudentInDBBase(StudentBase):
    """Base schema for data returned from the database."""
    student_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


#
# 5. HTTP GET (Response)
#
class StudentResponse(StudentInDBBase):
    """Schema used for API responses."""
    pass


#
# 6. Internal / DB Processing
#
class StudentInDB(StudentInDBBase):
    """Schema fully representing the database record internally."""
    pass