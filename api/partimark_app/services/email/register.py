"""
services/email/register.py

Handles the "welcome + set your password" email sent when an admin creates
a new staff account.

Industry-standard flow:
1. Admin creates user → system generates a cryptographically random token.
2. Token is hashed and stored in the DB with a 24-hour expiry.
3. A welcome email containing a one-time "Set Password" link is sent to the
   new user's email address.
4. User clicks the link → frontend POSTs to /auth/set-password with the raw
   token + their chosen password.
5. Backend verifies the token hash, sets the new password, and invalidates
   the token (one-time use).
"""

import secrets
import hashlib
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ...core.config import settings
from .email_sender import EmailSender

logger = logging.getLogger(__name__)

# Token lifetime (24 hours is standard for account setup links)
TOKEN_EXPIRY_HOURS = 24


def generate_set_password_token() -> tuple[str, str, datetime]:
    """
    Generates a secure one-time token for password setup.

    Returns:
        raw_token   — sent in the email link (never stored)
        token_hash  — SHA-256 hash stored in the DB
        expires_at  — UTC datetime when the token becomes invalid
    """
    raw_token = secrets.token_urlsafe(32)          # 256-bit entropy
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS)
    return raw_token, token_hash, expires_at


def send_welcome_set_password_email(
    user_email: str,
    user_display_name: str,
    raw_token: str,
) -> bool:
    """
    Sends a welcome email to a newly created staff member with a one-time
    'Set your password' link.

    Args:
        user_email        — recipient's email address
        user_display_name — recipient's display name for personalisation
        raw_token         — the raw (un-hashed) token to embed in the link

    Returns:
        True if email was sent successfully, False otherwise.
    """
    # Build the set-password URL (frontend route)
    frontend_base = getattr(settings, "frontend_url", "http://localhost:8000")
    set_password_url = f"{frontend_base}/reset-password?token={raw_token}"

    subject = "Welcome to PartiMark — Please Set Your Password"

    body = (
        f"Hello {user_display_name},\n\n"
        f"An administrator has created a PartiMark account for you.\n\n"
        f"To activate your account, please set your password by clicking the link below:\n\n"
        f"  {set_password_url}\n\n"
        f"This link will expire in {TOKEN_EXPIRY_HOURS} hours. "
        f"If you did not expect this email, you can safely ignore it.\n\n"
        f"Best regards,\n"
        f"The PartiMark Team"
    )

    sender = EmailSender()
    sent = sender.send_emails_bulk([
        {"to": user_email, "subject": subject, "body": body}
    ])

    if sent == 1:
        logger.info(f"Welcome email sent to {user_email}")
        return True
    else:
        logger.error(f"Failed to send welcome email to {user_email}")
        return False


def send_password_reset_email(
    user_email: str,
    user_display_name: str,
    raw_token: str,
) -> bool:
    """
    Sends a password-reset email to an existing user who has forgotten their password.
    Uses the same one-time token mechanism as the welcome email.

    Args:
        user_email        — recipient's email address
        user_display_name — recipient's display name for personalisation
        raw_token         — the raw (un-hashed) token to embed in the link

    Returns:
        True if email was sent successfully, False otherwise.
    """
    frontend_base = getattr(settings, "frontend_url", "http://localhost:8000")
    reset_url = f"{frontend_base}/reset-password?token={raw_token}"

    subject = "PartiMark — Password Reset Request"

    body = (
        f"Hello {user_display_name},\n\n"
        f"An administrator has initiated a password reset for your PartiMark account.\n\n"
        f"Click the link below to set a new password:\n\n"
        f"  {reset_url}\n\n"
        f"This link will expire in {TOKEN_EXPIRY_HOURS} hours. "
        f"If you did not request a password reset, please contact your administrator immediately.\n\n"
        f"Best regards,\n"
        f"The PartiMark Team"
    )

    sender = EmailSender()
    sent = sender.send_emails_bulk([
        {"to": user_email, "subject": subject, "body": body}
    ])

    if sent == 1:
        logger.info(f"Password reset email sent to {user_email}")
        return True
    else:
        logger.error(f"Failed to send password reset email to {user_email}")
        return False

