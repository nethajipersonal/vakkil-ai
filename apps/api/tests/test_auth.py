from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_request_otp_creates_user(client: AsyncClient):
    with patch("app.routers.auth.send_otp_email") as mock_email:
        mock_email.return_value = None
        response = await client.post("/api/v1/auth/request-otp", json={"email": "advocate@test.com"})
        assert response.status_code == 200
        assert "OTP sent" in response.json()["message"]
        mock_email.assert_called_once()


@pytest.mark.asyncio
async def test_verify_otp_invalid(client: AsyncClient):
    with patch("app.routers.auth.send_otp_email"):
        await client.post("/api/v1/auth/request-otp", json={"email": "advocate@test.com"})

    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": "advocate@test.com", "otp": "000000"},
    )
    assert response.status_code == 400
    assert "Invalid" in response.json()["detail"]


@pytest.mark.asyncio
async def test_request_otp_invalid_email(client: AsyncClient):
    response = await client.post("/api/v1/auth/request-otp", json={"email": "not-an-email"})
    assert response.status_code == 422
