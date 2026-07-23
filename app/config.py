from pathlib import Path
from dotenv import load_dotenv
import os

# find .env file in directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# read & store key values
class Settings:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY", "fallback")
        self.algorithm = "HS256"
        self.database_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/innkeep")

# create class instance for direct use from other files
settings = Settings()