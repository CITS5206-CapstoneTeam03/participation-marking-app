from datetime import datetime
from typing import Optional

import bcrypt
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from models.users import UserRole

#
# 1. Base Schema
#
class UserBase(BaseModel):
    """Shared properties across most User-related schemas."""
    email: EmailStr
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    preferred_name: str = Field(..., max_length=100)
    display_name: str = Field(..., max_length=200)
    role: UserRole
    is_active: bool = True


#
# 2. HTTP POST (Create)
#
class UserCreate(UserBase):
    """Properties needed to create a new user via API."""
    password: str = Field(
        ..., 
        min_length=8, 
        description="The raw password. This should be hashed before saving to the database."
    )

    def get_hashed_password(self) -> str:
        """Utility method to securely hash the password using bcrypt."""
        # bcrypt requires bytes, so we encode the string to utf-8
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(self.password.encode('utf-8'), salt)
        # decode back to string for database storage
        return hashed_password.decode('utf-8')


#
# 3. HTTP PUT / PATCH (Update)
#
class UserUpdate(BaseModel):
    """
    Properties that can be updated via API. 
    All fields are optional to support partial updates (PATCH methodology).
    """
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=200)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)


#
# 4. Shared DB Properties 
#
class UserInDBBase(UserBase):
    """Base schema for data returned from the database."""
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Pydantic V2 configuration to allow parsing from SQLAlchemy models
    model_config = ConfigDict(from_attributes=True)


#
# 5. HTTP GET (Response)
#
class UserResponse(UserInDBBase):
    """
    Schema used for API responses. 
    Inherits from UserInDBBase but ensures we NEVER return the password.
    """
    pass


#
# 6. Internal / DB Processing
#
class UserInDB(UserInDBBase):
    """
    Schema containing security-sensitive DB fields.
    Used for internal logic (e.g. comparing passwords in auth).
    NEVER use this as an API response model.
    """
    hashed_password: str
