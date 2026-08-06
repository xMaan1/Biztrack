"""
Security Module - JWT, Password Hashing, and Authentication Utilities
"""

import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import settings
from .exceptions import AuthenticationError, TokenError

# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
)

# Security scheme for JWT
security_scheme = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt
    """
    return pwd_context.hash(password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh",
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenError("Token has expired", status_code=status.HTTP_401_UNAUTHORIZED)
    except jwt.JWTClaimsError:
        raise TokenError("Invalid token claims", status_code=status.HTTP_401_UNAUTHORIZED)
    except jwt.JWTError:
        raise TokenError("Invalid token", status_code=status.HTTP_401_UNAUTHORIZED)


def validate_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    """
    Validate token and check token type
    """
    payload = decode_token(token)
    
    # Check token type
    if payload.get("type") != token_type:
        raise TokenError(
            f"Invalid token type. Expected {token_type}",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if user_id exists
    if "sub" not in payload:
        raise TokenError(
            "Invalid token: missing user identifier",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> Dict[str, Any]:
    """
    Dependency to get current user from JWT token
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = validate_token(credentials.credentials, "access")
        return {
            "user_id": int(payload["sub"]),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "full_name": payload.get("full_name"),
            "token_jti": payload.get("jti"),
        }
    except TokenError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, otherwise None
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


def generate_jti() -> str:
    """
    Generate a unique JWT ID (jti)
    """
    return ''.join(random.choices(string.ascii_letters + string.digits, k=32))


def generate_verification_token() -> str:
    """
    Generate a random verification token
    """
    return ''.join(random.choices(string.ascii_letters + string.digits, k=64))


def generate_reset_token() -> str:
    """
    Generate a password reset token
    """
    return ''.join(random.choices(string.ascii_letters + string.digits, k=64))


def hash_face_encoding(encoding: list) -> str:
    """
    Hash face encoding data for storage (not used for actual face matching)
    """
    import json
    import hashlib
    
    encoding_str = json.dumps(encoding)
    return hashlib.sha256(encoding_str.encode()).hexdigest()


def verify_role(required_roles: list, user_role: str) -> bool:
    """
    Verify if user has required role
    """
    # Admin has all permissions
    if user_role == "admin":
        return True
    
    return user_role in required_roles


def check_permission(user_roles: list, required_permissions: list) -> bool:
    """
    Check if user has required permissions
    """
    # Admin has all permissions
    if "admin" in user_roles:
        return True
    
    for perm in required_permissions:
        if perm not in user_roles:
            return False
    
    return True


# Password strength validator
def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    Returns (is_valid, message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?/~`" for c in password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is strong"


__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "validate_token",
    "get_current_user",
    "get_current_user_optional",
    "generate_jti",
    "generate_verification_token",
    "generate_reset_token",
    "verify_role",
    "check_permission",
    "validate_password_strength",
    "security_scheme",
]