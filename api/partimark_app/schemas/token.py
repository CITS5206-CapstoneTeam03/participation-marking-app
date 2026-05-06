from pydantic import BaseModel

class TokenResponse(BaseModel):
    """Schema returned after a successful login."""
    access_token: str
    token_type: str = "Bearer"
