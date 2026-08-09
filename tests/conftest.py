import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.security import hash_password
from app.models import User, Role
from app import models

TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(client):
    db = TestingSessionLocal()
    yield db
    db.close()

@pytest.fixture
def admin_token(client, db_session):
    admin = User(
        name="Admin User",
        email="admin@test.com",
        password_hash=hash_password("adminpass123"),
        role=Role.ADMIN,
    )
    db_session.add(admin)
    db_session.commit()

    response = client.post("/auth/login", data={
        "username": "admin@test.com",
        "password": "adminpass123",
    })
    return response.json()["access_token"]

@pytest.fixture
def guest_token(client):
    client.post("/auth/register", json={
        "name": "Guest User",
        "email": "guest@test.com",
        "password": "guestpass123",
    })
    response = client.post("/auth/login", data={
        "username": "guest@test.com",
        "password": "guestpass123",
    })
    return response.json()["access_token"]