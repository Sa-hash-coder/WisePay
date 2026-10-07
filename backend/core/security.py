import datetime
import hashlib
import hmac
import os
from typing import Any, Dict, Optional, Union

try:
    from core.config import ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY
except ImportError:
    from backend.core.config import ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY

# Direct bcrypt integration (clean without passlib version check warnings on Python 3.13)
try:
    import bcrypt
    _has_bcrypt = True
except ImportError:
    _has_bcrypt = False

# JWT Setup (supports python-jose or pyjwt)
try:
    from jose import JWTError, jwt
except ImportError:
    import jwt
    class JWTError(Exception):
        pass


def get_password_hash(password: str) -> str:
    """Hashes a plaintext password using bcrypt directly, with PBKDF2 fallback."""
    if _has_bcrypt:
        try:
            pwd_bytes = password.encode("utf-8")
            salt = bcrypt.gensalt()
            return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")
        except Exception:
            pass

    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"pbkdf2:{salt}:{key}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plaintext password against hashed password."""
    if not hashed_password or not plain_password:
        return False

    if hashed_password.startswith("pbkdf2:"):
        parts = hashed_password.split(":")
        if len(parts) == 3:
            _, salt, expected_key = parts
            computed_key = hashlib.pbkdf2_hmac(
                "sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000
            ).hex()
            return hmac.compare_digest(expected_key, computed_key)

    if hashed_password.startswith("$sha256$"):
        expected_key = hashed_password.replace("$sha256$", "")
        computed_key = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
        return hmac.compare_digest(expected_key, computed_key)

    if _has_bcrypt:
        try:
            plain_bytes = plain_password.encode("utf-8")
            hash_bytes = hashed_password.encode("utf-8")
            return bcrypt.checkpw(plain_bytes, hash_bytes)
        except Exception:
            pass

    return False


def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[datetime.timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Creates a signed JWT bearer access token."""
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": now,
    }

    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token signature and expiration."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
