from unittest.mock import patch

def create_room_type(client, admin_token):
    response = client.post("/room-types/", json={
        "name": "Standard Room",
        "description": "A nice room",
        "single_beds": 2,
        "king_beds": 0,
        "queen_beds": 0,
        "weekday_price": "100.00",
        "weekend_price": "150.00",
        "holiday_price": "200.00",
        "accommodates": 2,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    return response.json()

def create_room(client, admin_token, room_type_id, room_number=101):
    response = client.post("/rooms/", json={
        "room_type_id": room_type_id,
        "room_number": room_number,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    return response.json()

def test_booking_quote_calculates_weekday_price(client, admin_token):
    room_type = create_room_type(client, admin_token)
    room = create_room(client, admin_token, room_type["id"])

    # Monday to Wednesday = 2 weekday nights
    response = client.post("/bookings/quote", json={
        "room_id": room["id"],
        "check_in": "2026-08-10",  # Monday
        "check_out": "2026-08-12",  # Wednesday
    })
    assert response.status_code == 200
    assert response.json()["total_price"] == "200.00"

def test_booking_quote_rejects_invalid_dates(client, admin_token):
    room_type = create_room_type(client, admin_token)
    room = create_room(client, admin_token, room_type["id"])

    response = client.post("/bookings/quote", json={
        "room_id": room["id"],
        "check_in": "2026-08-12",
        "check_out": "2026-08-10",
    })
    assert response.status_code == 400

def test_create_booking_requires_auth(client, admin_token):
    room_type = create_room_type(client, admin_token)
    room = create_room(client, admin_token, room_type["id"])

    response = client.post("/bookings/", json={
        "room_id": room["id"],
        "check_in": "2026-08-10",
        "check_out": "2026-08-12",
    })
    assert response.status_code == 401

def test_create_booking_succeeds(client, admin_token, guest_token):
    room_type = create_room_type(client, admin_token)
    room = create_room(client, admin_token, room_type["id"])

    response = client.post("/bookings/", json={
        "room_id": room["id"],
        "check_in": "2026-08-10",
        "check_out": "2026-08-12",
    }, headers={"Authorization": f"Bearer {guest_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "confirmed"
    assert data["total_price"] == "200.00"

def test_create_booking_rejects_overlapping_dates(client, admin_token, guest_token):
    room_type = create_room_type(client, admin_token)
    room = create_room(client, admin_token, room_type["id"])

    client.post("/bookings/", json={
        "room_id": room["id"],
        "check_in": "2026-08-10",
        "check_out": "2026-08-12",
    }, headers={"Authorization": f"Bearer {guest_token}"})

    response = client.post("/bookings/", json={
        "room_id": room["id"],
        "check_in": "2026-08-11",
        "check_out": "2026-08-13",
    }, headers={"Authorization": f"Bearer {guest_token}"})
    assert response.status_code == 409

def test_guest_cannot_create_room_type(client, guest_token):
    response = client.post("/room-types/", json={
        "name": "Should Fail",
        "description": "test",
        "single_beds": 1,
        "king_beds": 0,
        "queen_beds": 0,
        "weekday_price": "50.00",
        "weekend_price": "60.00",
        "holiday_price": "70.00",
        "accommodates": 1,
    }, headers={"Authorization": f"Bearer {guest_token}"})
    assert response.status_code == 403

def test_multi_booking_succeeds_with_multiple_room_types(client, admin_token, guest_token):
    room_type_1 = create_room_type(client, admin_token)
    room_1 = create_room(client, admin_token, room_type_1["id"], room_number=201)

    response = client.post("/room-types/", json={
        "name": "Suite",
        "description": "A suite",
        "single_beds": 0, "king_beds": 1, "queen_beds": 0,
        "weekday_price": "200.00", "weekend_price": "250.00", "holiday_price": "300.00",
        "accommodates": 4,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    room_type_2 = response.json()
    room_2 = create_room(client, admin_token, room_type_2["id"], room_number=301)

    response = client.post("/bookings/multi", json={
        "items": [
            {"room_type_id": room_type_1["id"], "quantity": 1},
            {"room_type_id": room_type_2["id"], "quantity": 1},
        ],
        "check_in": "2026-08-10",
        "check_out": "2026-08-12",
        "payment_intent_id": "pi_fake_test_id",
    }, headers={"Authorization": f"Bearer {guest_token}"})

    assert response.status_code == 200
    bookings = response.json()
    assert len(bookings) == 2
    assert all(b["status"] == "confirmed" for b in bookings)


def test_multi_booking_rejects_and_refunds_on_insufficient_availability(client, admin_token, guest_token):
    room_type = create_room_type(client, admin_token)
    create_room(client, admin_token, room_type["id"], room_number=401)  # only 1 room exists

    with patch("stripe.Refund.create") as mock_refund:
        response = client.post("/bookings/multi", json={
            "items": [{"room_type_id": room_type["id"], "quantity": 2}],  # requesting 2, only 1 exists
            "check_in": "2026-08-10",
            "check_out": "2026-08-12",
            "payment_intent_id": "pi_fake_test_id",
        }, headers={"Authorization": f"Bearer {guest_token}"})

        assert response.status_code == 409
        mock_refund.assert_called_once_with(payment_intent="pi_fake_test_id")

    # confirm nothing partial was created
    bookings_res = client.get("/bookings/", headers={"Authorization": f"Bearer {guest_token}"})
    assert len(bookings_res.json()) == 0

def test_room_type_cap_at_ten(client, admin_token):
    for i in range(10):
        response = client.post("/room-types/", json={
            "name": f"Type {i}",
            "description": "test",
            "single_beds": 1, "king_beds": 0, "queen_beds": 0,
            "weekday_price": "50.00", "weekend_price": "60.00", "holiday_price": "70.00",
            "accommodates": 1,
        }, headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200

    response = client.post("/room-types/", json={
        "name": "Eleventh Type",
        "description": "should fail",
        "single_beds": 1, "king_beds": 0, "queen_beds": 0,
        "weekday_price": "50.00", "weekend_price": "60.00", "holiday_price": "70.00",
        "accommodates": 1,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 400