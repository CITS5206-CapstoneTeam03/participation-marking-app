from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


#
# 1. Base Schema
#
class EnabledWeekBase(BaseModel):
    """Shared properties across enabled week schemas."""
    week_number: int = Field(..., ge=1, le=12, description="Enabled teaching week number")


#
# 2. HTTP POST (Create)
#
class EnabledWeekCreate(EnabledWeekBase):
    """Properties needed to create an enabled week."""
    pass


#
# 3. Shared DB Properties
#
class EnabledWeekInDBBase(EnabledWeekBase):
    """Base schema for data returned from the database."""
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


#
# 4. HTTP GET (Response)
#
class EnabledWeekResponse(EnabledWeekInDBBase):
    """Schema used for API responses."""
    pass


#
# 5. Internal / DB Processing
#
class EnabledWeekInDB(EnabledWeekInDBBase):
    """Schema fully representing the database record internally."""
    pass
    week_number: int = Field(..., ge=1, le=12, description="Enabled teaching week number")


#
# 2. HTTP POST (Create)
#
class EnabledWeekCreate(EnabledWeekBase):
    """Properties needed to create an enabled week."""
    pass


#
# 3. Shared DB Properties
#
class EnabledWeekInDBBase(EnabledWeekBase):
    """Base schema for data returned from the database."""
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


#
# 4. HTTP GET (Response)
#
class EnabledWeekResponse(EnabledWeekInDBBase):
    """Schema used for API responses."""
    pass


#
# 5. Internal / DB Processing
#
class EnabledWeekInDB(EnabledWeekInDBBase):
    """Schema fully representing the database record internally."""
    pass