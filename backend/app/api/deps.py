from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token, has_permission
from app.db.session import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    email = decode_token(token)
    user = db.query(User).filter(User.email == email).first() if email else None
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    return user


def require(permission: str):
    """Dependency factory for role-based access control (feature 14)."""

    def checker(user: User = Depends(current_user)) -> User:
        if not has_permission(user.role, permission):
            raise HTTPException(status_code=403, detail=f"Role '{user.role}' is not allowed to {permission}")
        return user

    return checker
