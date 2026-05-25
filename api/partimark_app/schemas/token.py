from pydantic import BaseModel

class TokenPayload(BaseModel):
    user_id: str
    user_role: str

class TokenResponse(BaseModel):
    """Schema returned after a successful login."""
    access_token: str
    token_type: str = "Bearer"
    expires_at: str
    payload: TokenPayload
