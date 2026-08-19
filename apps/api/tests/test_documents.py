import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Template
from app.models.user import User


@pytest.fixture
async def seeded_template(db_session: AsyncSession) -> Template:
    template = Template(
        name="Legal Notice",
        slug="legal-notice",
        description="Send a formal legal notice",
        doc_type="legal_notice",
        supported_languages=["ta", "en"],
        form_schema={
            "type": "object",
            "properties": {
                "sender_name": {"type": "string"},
                "recipient_name": {"type": "string"},
                "amount": {"type": "number"},
            },
        },
        system_prompt="You are a legal document drafting expert. Draft a formal legal notice in the requested language.",
    )
    db_session.add(template)
    await db_session.commit()
    await db_session.refresh(template)
    return template


@pytest.fixture
async def auth_client(client: AsyncClient, db_session: AsyncSession):
    from unittest.mock import patch
    from app.core.security import create_access_token, hash_otp, generate_otp
    from datetime import UTC, datetime, timedelta
    from app.models.user import OTPCode

    user = User(email="advocate@test.com", full_name="Test Advocate", is_verified=True)
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(user.id)
    await db_session.commit()

    client.cookies.set("access_token", token)
    return client


@pytest.mark.asyncio
async def test_list_templates(client: AsyncClient, seeded_template: Template):
    response = await client.get("/api/v1/documents/templates")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["slug"] == "legal-notice"


@pytest.mark.asyncio
async def test_get_template_by_slug(client: AsyncClient, seeded_template: Template):
    response = await client.get("/api/v1/documents/templates/legal-notice")
    assert response.status_code == 200
    assert response.json()["name"] == "Legal Notice"


@pytest.mark.asyncio
async def test_get_template_not_found(client: AsyncClient):
    response = await client.get("/api/v1/documents/templates/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_document_requires_auth(client: AsyncClient, seeded_template: Template):
    response = await client.post(
        "/api/v1/documents/generate",
        json={
            "template_id": seeded_template.id,
            "title": "Test Notice",
            "language": "ta",
            "form_data": {"sender_name": "Test"},
        },
    )
    assert response.status_code == 401
