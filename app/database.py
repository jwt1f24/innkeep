from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# connect sqlalchemy to postgres & create new database session
engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)

# base class for model inheritance
class Base(DeclarativeBase):
    pass

# database session per request via fastapi
def get_db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()