from datetime import datetime
from typing import Optional

import bcrypt
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..models.users import UserRole

#
# 1. Base Schema
#
class UserBase(BaseModel):
    """Shared properties across most User-related schemas."""
    email: EmailStr
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    display_name: str = Field(..., max_length=200)
    role: UserRole
    is_active: bool = False  # Inactive until user completes account activation


#
# 2. HTTP POST (Create)
#
class UserCreate(UserBase):
    """Properties needed to create a new user via API."""
    password: str = Field(
        ...,
        min_length=8,
        description="The raw password. This should be hashed before saving to the database.",
    )

    def get_hashed_password(self) -> str:
        """Utility method to securely hash the password using bcrypt."""
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(self.password.encode("utf-8"), salt)
        return hashed_password.decode("utf-8")


#
# Self-update schema — for authenticated users editing their own profile.
# Email, role, is_active, and password are intentionally excluded.
# These are controlled by admins only.
#
class UserSelfUpdate(BaseModel):
    """Fields a user is permitted to update on their own account."""
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=200)


#
# First-login / account activation schema.
# Submitted from reset_password.html when a newly created user sets their password.
# Requires name fields so the user completes their profile in one step.
# Admin cannot use this endpoint — it is token-gated and unauthenticated.
#
class UserFirstLoginSetup(BaseModel):
    """Payload for the account-activation (set-password) form."""
    token: str = Field(..., description="One-time token from the welcome email.")
    new_password: str = Field(..., min_length=8, description="Chosen password (min 8 chars).")
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    preferred_name: Optional[str] = Field(None, max_length=100)
    display_name: str = Field(..., max_length=200)


#
# 4. Shared DB Properties
#
class UserInDBBase(UserBase):
    """Base schema for data returned from the database."""
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


#
# 5. HTTP GET (Response)
#
class UserResponse(UserInDBBase):
    """
    Schema used for API responses.
    Never returns hashed_password.
    """
    pass


#
# 6. Internal / DB Processing
#
class UserInDB(UserInDBBase):
    """
    Schema containing security-sensitive DB fields.
    Used for internal logic only.
    """
    hashed_password: str
