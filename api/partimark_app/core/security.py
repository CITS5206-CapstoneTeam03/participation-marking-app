"""
core/security.py

PASETO (Platform-Agnostic Security Tokens) v4 local authentication utilities.

Uses PASETO v4.local (symmetric authenticated encryption via XChaCha20-Poly1305)
instead of JWT. This avoids the algorithm-confusion vulnerabilities inherent in JWT
and provides a simpler, more secure default token format.

Design decisions:
    - v4.local  : symmetric key, simplest setup, no PKI required
    - Payload   : plain JSON with standard claims (sub, role, exp, iat)
    - Expiry    : enforced during decoding — expired tokens raise TokenExpiredError
    - Key size  : exactly 32 bytes, derived from the env secret via HKDF-SHA256

Dependencies:
    pip install pyseto
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import pyseto
from pyseto import Key

from .config import settings


# ---------------------------------------------------------------------------
# 1. Exceptions
# ---------------------------------------------------------------------------

class TokenExpiredError(Exception):
    """Raised when a PASETO token has passed its expiry time."""


class TokenInvalidError(Exception):
    """Raised when a PASETO token cannot be decoded or verified."""


# ---------------------------------------------------------------------------
# 2. Key Bootstrap
# ---------------------------------------------------------------------------

def _build_paseto_key() -> Key:
    """
    Derive a 32-byte symmetric key for PASETO v4.local from the configured secret.

    The secret in .env is allowed to be any length — we SHA-256 hash it to
    guarantee the required 32-byte key length without truncating entropy.
    """
    import hashlib
    raw_secret: str = settings.paseto_secret_key
    key_bytes: bytes = hashlib.sha256(raw_secret.encode("utf-8")).digest()  # always 32 bytes
    return Key.new(version=4, purpose="local", key=key_bytes)


# Build the key once at import time.  Re-creating it on every request is safe
# but wasteful; module-level is idiomatic for stateless crypto utilities.
_PASETO_KEY: Key = _build_paseto_key()


# ---------------------------------------------------------------------------
# 3. Token Creation
# ---------------------------------------------------------------------------

def create_access_token(
    subject: str,
    role: str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """
    Create a PASETO v4.local access token.

    Args:
        subject:       The user identifier (e.g. user_id UUID string).
        role:          The user's role string (e.g. "admin", "facilitator").
        expires_delta: How long the token should be valid. Defaults to
                       settings.access_token_expire_minutes.
        extra_claims:  Any additional key/value pairs to embed in the payload.

    Returns:
        A PASETO token string (v4.local.<base64url-payload>.<base64url-tag>).
    """
    now = datetime.now(tz=timezone.utc)
    expire = now + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )

    payload: dict[str, Any] = {
        "sub": subject,          # subject (user_id)
        "role": role,            # user role for RBAC
        "iat": now.isoformat(),  # issued-at
        "exp": expire.isoformat(),  # expiry (ISO 8601 UTC)
    }

    if extra_claims:
        payload.update(extra_claims)

    token_bytes: bytes = pyseto.encode(
        _PASETO_KEY,
        json.dumps(payload).encode("utf-8"),
    )

    # pyseto.encode returns bytes; decode to a plain string for HTTP transport.
    return token_bytes.decode("utf-8")


# ---------------------------------------------------------------------------
# 4. Token Verification / Decoding
# ---------------------------------------------------------------------------

def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a PASETO v4.local token.

    Args:
        token: The raw PASETO token string from the Authorization header.

    Returns:
        The decoded payload dictionary.

    Raises:
        TokenExpiredError:  Token signature is valid but the `exp` claim has passed.
        TokenInvalidError:  Token is malformed, tampered with, or uses the wrong key.
    """
    try:
        decoded = pyseto.decode(_PASETO_KEY, token.encode("utf-8"))
        payload: dict[str, Any] = json.loads(decoded.payload.decode("utf-8"))
    except Exception as exc:
        raise TokenInvalidError(f"Could not decode token: {exc}") from exc

    # Manually enforce expiry — pyseto v4.local does NOT auto-validate `exp`.
    exp_str: str | None = payload.get("exp")
    if exp_str is None:
        raise TokenInvalidError("Token is missing the required 'exp' claim.")

    exp_dt = datetime.fromisoformat(exp_str)
    if datetime.now(tz=timezone.utc) >= exp_dt:
        raise TokenExpiredError("Token has expired.")

    return payload


# ---------------------------------------------------------------------------
# 5. Password Verification
# ---------------------------------------------------------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a bcrypt hash stored in the database.

    Hashing is handled by UserCreate.get_hashed_password() in schemas/users.py.
    Verification lives here so auth logic stays in the security layer.

    Args:
        plain_password:   The raw password provided by the user at login.
        hashed_password:  The bcrypt hash retrieved from the User DB record.

    Returns:
        True if the password matches the hash, False otherwise.
    """
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )