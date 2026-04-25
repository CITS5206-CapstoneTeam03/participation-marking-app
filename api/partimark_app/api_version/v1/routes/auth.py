"""
api_version/v1/routes/auth.py

Authentication endpoints.

POST /auth/login  —  Accepts email + password, returns a PASETO v4.local token.

Uses OAuth2PasswordRequestForm so Swagger UI renders a proper "Authorize" button.
The `username` field in that form carries the email address.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ....core.security import create_access_token, verify_password #type: ignore
from ....crud import crud_users as crud #type: ignore
from ....db.db import get_db #type: ignore
from ....schemas.token import TokenResponse #type: ignore

router = APIRouter()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and obtain a PASETO access token",
    description=(
        "Accepts an email address (in the `username` field) and password. "
        "Returns a PASETO v4.local token to be sent as `Authorization: Bearer <token>` "
        "on subsequent requests."
    ),
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate a user and issue a PASETO access token.

    Steps:
        1. Look up the user by email (form_data.username holds the email).
        2. Verify the provided password against the stored bcrypt hash.
        3. Reject inactive accounts.
        4. Issue a PASETO v4.local token with sub (user_id) and role claims.
    """
    # 1. Fetch the user record
    user = crud.get_user_by_email(db, email=form_data.username)

    # Use a generic error message to avoid user-enumeration attacks.
    credential_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if user is None:
        raise credential_error

    # 2. Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise credential_error

    # 3. Reject inactive accounts
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive. Please contact an administrator.",
        )

    # 4. Issue PASETO token
    access_token = create_access_token(
        subject=user.user_id,
        role=user.role.value,  # e.g. "admin", "uc", "facilitator"
    )

    return TokenResponse(access_token=access_token)
