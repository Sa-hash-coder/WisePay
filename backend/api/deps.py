import sys
import uuid
from pathlib import Path
from typing import Generator, List

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import SessionLocal
from models import User
from core.security import decode_access_token

# OAuth2 Password Bearer Token Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_db() -> Generator[Session, None, None]:
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    """Decodes JWT Bearer token and retrieves authenticated User."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
        user_identifier: str = payload.get("sub")
        if not user_identifier:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    # Attempt lookup by email first, then by UUID
    user = db.query(User).filter(User.email == user_identifier).first()
    if not user:
        try:
            u_id = uuid.UUID(user_identifier)
            user = db.query(User).filter(User.id == u_id).first()
        except (ValueError, TypeError):
            pass

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return user


def require_role(allowed_roles: List[str]):
    """
    Role-Based Access Control (RBAC) Dependency Factory.
    Validates that the authenticated user possesses one of the allowed roles,
    supporting standard role names and aliases.
    """
    # Normalize aliases to match database role IDs
    normalized_allowed = set()
    for r in allowed_roles:
        normalized_allowed.add(r)
        normalized_allowed.add(r.upper())
        if r.upper() in ["AP_REVIEWER", "AP REVIEWER"]:
            normalized_allowed.add("AP / FINANCE REVIEWER")
        if r.upper() in ["ORIGINATOR", "THE ORIGINATOR", "THE_ORIGINATOR"]:
            normalized_allowed.add("THE ORIGINATOR")
        if r.upper() in ["AUDITOR", "COMPLIANCE AUDITOR", "COMPLIANCE_AUDITOR"]:
            normalized_allowed.add("AUDITOR")

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role_id
        if user_role not in normalized_allowed and user_role.upper() not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Role '{current_user.role_id}' is not authorized. Required: {allowed_roles}.",
            )
        return current_user

    return role_checker
