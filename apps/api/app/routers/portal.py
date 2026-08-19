"""Client-facing portal: auth + data endpoints."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_client
from app.core.security import create_portal_token, generate_otp, hash_otp, verify_otp
from app.models.client import Client, FeeEntry
from app.models.document import Document
from app.models.user import User
from app.services.otp_service import send_otp_email

router = APIRouter(prefix="/portal", tags=["portal"])

OTP_EXPIRY_MINUTES = 10


# ── Auth ──────────────────────────────────────────────────────────────────────

class PortalOTPRequest(BaseModel):
    email: EmailStr


class PortalOTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class PortalClientResponse(BaseModel):
    id: str
    full_name: str
    email: str | None
    phone: str | None

    model_config = {"from_attributes": True}


class PortalTokenResponse(BaseModel):
    portal_token: str
    client: PortalClientResponse


@router.post("/auth/request-otp")
async def portal_request_otp(
    body: PortalOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    result = await db.execute(select(Client).where(Client.email == body.email).limit(1))
    client = result.scalar_one_or_none()
    if client is None:
        # Don't reveal whether email exists
        return {"message": "If this email is registered, an OTP has been sent"}

    if not client.portal_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Portal access not enabled for this account. Contact your advocate.",
        )

    otp = generate_otp()
    client.portal_otp_hash = hash_otp(otp)
    client.portal_otp_expires = datetime.now(UTC) + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.commit()

    await send_otp_email(email=body.email, otp=otp)
    return {"message": "OTP sent to your email"}


@router.post("/auth/verify-otp", response_model=PortalTokenResponse)
async def portal_verify_otp(
    body: PortalOTPVerify,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> PortalTokenResponse:
    result = await db.execute(select(Client).where(Client.email == body.email).limit(1))
    client = result.scalar_one_or_none()

    if (
        client is None
        or not client.portal_otp_hash
        or not client.portal_otp_expires
        or client.portal_otp_expires < datetime.now(UTC)
        or not verify_otp(body.otp, client.portal_otp_hash)
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

    client.portal_otp_hash = None
    client.portal_otp_expires = None
    await db.commit()

    token = create_portal_token(client.id)
    response.set_cookie(
        key="portal_token",
        value=token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=86400 * 7,
    )
    return PortalTokenResponse(
        portal_token=token,
        client=PortalClientResponse.model_validate(client),
    )


@router.post("/auth/logout")
async def portal_logout(response: Response) -> dict[str, str]:
    response.delete_cookie("portal_token")
    return {"message": "Logged out"}


# ── Data endpoints ────────────────────────────────────────────────────────────

class PortalFeeResponse(BaseModel):
    id: str
    amount: float
    description: str
    entry_date: str
    is_received: bool
    case_id: str | None

    model_config = {"from_attributes": True}


class PortalDocResponse(BaseModel):
    id: str
    title: str
    doc_type: str
    language: str
    status: str
    created_at: str

    model_config = {"from_attributes": True}


class PortalSummary(BaseModel):
    client: PortalClientResponse
    advocate_name: str
    total_billed: float
    total_received: float
    pending: float
    documents_shared: int


@router.get("/me", response_model=PortalSummary)
async def portal_me(
    current_client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> PortalSummary:
    # Get advocate name
    adv_result = await db.execute(select(User).where(User.id == current_client.advocate_id))
    advocate = adv_result.scalar_one_or_none()

    # Fee totals
    fee_result = await db.execute(
        select(
            func.coalesce(func.sum(FeeEntry.amount), 0).label("total"),
            func.coalesce(func.sum(FeeEntry.amount).filter(FeeEntry.is_received == True), 0).label("received"),  # noqa: E712
        ).where(FeeEntry.client_id == current_client.id)
    )
    row = fee_result.one()
    total = float(row.total)
    received = float(row.received)

    # Documents shared with this client
    doc_count_result = await db.execute(
        select(func.count(Document.id)).where(
            Document.owner_id == current_client.advocate_id,
            Document.shared_with_client == True,  # noqa: E712
        )
    )
    doc_count = doc_count_result.scalar() or 0

    return PortalSummary(
        client=PortalClientResponse.model_validate(current_client),
        advocate_name=advocate.full_name if advocate else "Your Advocate",
        total_billed=total,
        total_received=received,
        pending=total - received,
        documents_shared=doc_count,
    )


@router.get("/fees", response_model=list[PortalFeeResponse])
async def portal_fees(
    current_client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> list[PortalFeeResponse]:
    result = await db.execute(
        select(FeeEntry)
        .where(FeeEntry.client_id == current_client.id)
        .order_by(FeeEntry.entry_date.desc())
        .limit(100)
    )
    return [
        PortalFeeResponse(
            id=f.id,
            amount=float(f.amount),
            description=f.description,
            entry_date=str(f.entry_date),
            is_received=f.is_received,
            case_id=f.case_id,
        )
        for f in result.scalars().all()
    ]


@router.get("/documents", response_model=list[PortalDocResponse])
async def portal_documents(
    current_client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> list[PortalDocResponse]:
    result = await db.execute(
        select(Document).where(
            Document.owner_id == current_client.advocate_id,
            Document.shared_with_client == True,  # noqa: E712
        ).order_by(Document.created_at.desc())
    )
    return [
        PortalDocResponse(
            id=d.id, title=d.title, doc_type=d.doc_type, language=d.language,
            status=d.status, created_at=d.created_at.isoformat(),
        )
        for d in result.scalars().all()
    ]
