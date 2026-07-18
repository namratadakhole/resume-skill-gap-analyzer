import os
import jwt
import asyncio
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
from database import users_collection

# Config
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    import logging
    logging.warning("JWT_SECRET environment variable is not set. Using testing fallback key.")
    SECRET_KEY = "super_secret_resume_key_for_testing"
    
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

security_scheme = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        if email is None:
            raise credentials_exception
            
        # If user_id is embedded in payload, return immediately without DB latency
        if user_id:
            return {"_id": user_id, "email": email, "name": payload.get("name", email.split('@')[0])}
    except jwt.PyJWTError:
        raise credentials_exception
        
    # Attempt DB fetch with 2-second timeout protection to prevent network hangs if Atlas is slow
    try:
        user = await asyncio.wait_for(users_collection.find_one({"email": email}), timeout=2.0)
        if user:
            return user
    except Exception as e:
        print(f"[AUTH WARNING] DB lookup for user failed/timed out: {str(e)}")
        
    return {"_id": email, "email": email, "name": email.split('@')[0]}
