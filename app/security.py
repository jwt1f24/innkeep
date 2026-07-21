import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from app.config import settings

# hashing user password
def hash_password(password: str) -> str:
    pwBytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwBytes, salt)
    plaintext = hashed.decode("utf-8")
    return plaintext

# verifying user password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    result = bcrypt.checkpw(plain_bytes, hashed_bytes)
    return result

def create_access_token(sub: str) -> str:
    payload = {
        "sub": sub,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return token

def decode_access_token(token: str) -> dict | None:
    try:
        result = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return result
    except JWTError:
        return None