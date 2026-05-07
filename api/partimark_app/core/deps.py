from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from partimark_app.db.db import get_db
from partimark_app.crud import crud_users
from .security import decode_access_token, TokenExpiredError, TokenInvalidError

# This tells FastAPI where Swagger UI should send credentials to get a token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    FastAPI Dependency that extracts the Bearer token from the header,
    decodes it using PASETO, and returns the payload if valid.
    """
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        user = crud_users.get_user(db, user_id=user_id)
        
        # Security Check: Active Status
        if not user:
            raise HTTPException(status_code=401, detail="User no longer exists")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Inactive user")
            
        # Return user
        return user
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except TokenInvalidError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

from partimark_app.models.users import User, UserRole

def get_non_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency that ensures the current user is NOT an Admin.
    """
    if current_user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators are not permitted to access or modify marks.",
        )
    return current_user
