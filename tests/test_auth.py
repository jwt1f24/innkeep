# create new user
def test_register_create_user(client):
    response = client.post("/auth/register", json={
        "name": "User",
        "email": "user@innkeep.com",
        "password": "password123",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "user@innkeep.com"
    assert data["role"] == "guest"
    assert "password_hash" not in data

# duplicate email
def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "name": "User A",
        "email": "user@innkeep.com",
        "password": "password123"
    })
    response = client.post("/auth/register", json={
        "name": "User B",
        "email": "user@innkeep.com",
        "password": "password456"
    })
    assert response.status_code == 400

# invalid password length
def test_register_short_password(client):
    response = client.post("/auth/register", json={
        "name": "User",
        "email": "user@innkeep.com",
        "password": "123"
    })
    assert response.status_code == 422

# invalid name
def test_register_invalid_name(client):
    response = client.post("/auth/register", json={
        "name": "12345",
        "email": "user@innkeep.com",
        "password": "password123"
    })
    assert response.status_code == 422

# login successful
def test_login_success(client):
    client.post("/auth/register", json={
        "name": "User",
        "email": "user@innkeep.com",
        "password": "password123"
    })
    response = client.post("/auth/login", data={
        "username": "user@innkeep.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

# wrong login password
def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "name": "User",
        "email": "user@innkeep.com",
        "password": "password123"
    })
    response = client.post("/auth/login", data={
        "username": "user@innkeep.com",
        "password": "password456"
    })
    assert response.status_code == 401

# protected pages redirection
def test_protected_route_requires_token(client):
    response = client.get("/bookings/")
    assert response.status_code == 401

# prevent admin to change their own role
def test_admin_cannot_demote_self(client, admin_token, db_session):
    from app.models import User
    admin_user = db_session.query(User).filter(User.email == "admin@test.com").first()

    response = client.patch(
        f"/users/{admin_user.id}/role?role=guest",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400