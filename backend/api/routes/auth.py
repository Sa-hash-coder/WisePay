import sys
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

BASE_DIR = Path(__file__).resolve().parent.parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from api.deps import get_current_user, get_db
from core.security import create_access_token, verify_password
from models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    OAuth2 compatible token login.
    Accepts form data with 'username' (email) and 'password'.
    Returns JWT access token.
    """
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = create_access_token(
        subject=user.email,
        extra_claims={
            "role": user.role_id,
            "name": user.full_name,
            "organization": user.organization,
        },
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }


@router.get("/me")
def read_current_user(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retrieves the currently authenticated user profile and organizational role.
    """
    return {
        "user": current_user.to_dict(),
        "role_details": current_user.role.to_dict() if current_user.role else None,
    }
