import bcrypt

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