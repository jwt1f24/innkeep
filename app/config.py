import os

# read & store key values
class Settings:
    def __init__(self):
        self.secret_key = os.getenv("INNKEEP_KEY", "fallback")
        self.algorithm = "HS256"

# create class instance for direct use from other files
settings = Settings()