"""
api_version/v1/routes/auth.py

Authentication endpoints.

POST /auth/login        —  Accepts email + password, returns a PASETO v4.local token.
POST /auth/set-password —  Consumes a one-time token to let a new user set their password.

Uses OAuth2PasswordRequestForm so Swagger UI renders a proper "Authorize" button.
The `username` field in that form carries the email address.
"""

import hashlib
from datetime import datetime, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ....core.security import create_access_token, verify_password #type: ignore
from ....crud import crud_users as crud #type: ignore
from ....db.db import get_db #type: ignore
from ....schemas.token import TokenResponse #type: ignore
from ....schemas.users import UserFirstLoginSetup #type: ignore

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


@router.post(
    "/set-password",
    summary="Activate account: set password and complete profile",
    description=(
        "Used on first login. Validates the one-time token, sets the user's password, "
        "and saves their name/display fields in one step. Token is invalidated immediately after use."
    ),
    status_code=status.HTTP_200_OK,
)
def set_password(
    body: UserFirstLoginSetup,
    db: Session = Depends(get_db),
) -> dict:
    """
    Consumes the one-time setup token and sets the user's password.

    Steps:
        1. Hash the incoming raw token with SHA-256.
        2. Look up the user by that hash (avoids full-table scan on raw tokens).
        3. Verify the token has not expired.
        4. Hash the new password with bcrypt and persist it.
        5. Clear the token immediately (one-time use).
    """
    # 1. Derive the hash of the incoming token
    incoming_hash = hashlib.sha256(body.token.encode()).hexdigest()

    # 2. Look up user — single indexed DB lookup, no timing leak from comparison
    user = crud.get_user_by_reset_token_hash(db, token_hash=incoming_hash)

    invalid_token_error = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired token. Please request a new one.",
    )

    if user is None:
        raise invalid_token_error

    # 3. Check expiry
    if user.password_reset_token_expires_at is None:
        raise invalid_token_error

    expiry = user.password_reset_token_expires_at
    # Normalise to UTC-aware for comparison
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expiry:
        # Clean up the stale token before rejecting
        crud.clear_reset_token(db, user)
        raise invalid_token_error

    # 4. Set password and update profile fields in one commit
    user.hashed_password = bcrypt.hashpw(body.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user.first_name = body.first_name
    user.last_name = body.last_name
    user.display_name = body.display_name
    user.is_active = True
    if body.preferred_name is not None:
        user.preferred_name = body.preferred_name

    # 5. Invalidate the token (one-time use)
    crud.clear_reset_token(db, user)

    return {"message": "Account activated successfully. You can now log in."}

