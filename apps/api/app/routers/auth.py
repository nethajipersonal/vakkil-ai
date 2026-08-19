from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, create_refresh_token, generate_otp, hash_otp, verify_otp
from app.models.user import OTPCode, User
from app.schemas.auth import (
    LoginRequest,
    OTPVerify,
    RegisterRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.services.otp_service import send_otp_email, send_otp_sms

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_EXPIRY_MINUTES = 10


async def _issue_otp(user: User, db: AsyncSession) -> str:
    otp = generate_otp()
    otp_record = OTPCode(
        user_id=user.id,
        hashed_code=hash_otp(otp),
        expires_at=datetime.now(UTC) + timedelta(minutes=OTP_EXPIRY_MINUTES),
    )
    db.add(otp_record)
    await db.commit()

    await send_otp_email(email=user.email, otp=otp)
    if user.phone:
        try:
            await send_otp_sms(phone=user.phone, otp=otp)
        except Exception:
            pass  # Email already sent; SMS is best-effort
    return "OTP sent to your email" + (" and phone" if user.phone else "")


@router.post("/register", status_code=status.HTTP_200_OK)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is not None and user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please sign in instead.",
        )

    if user is None:
        user = User(email=body.email, full_name=body.full_name, bar_council_number=body.bar_council_number)
        db.add(user)
        await db.flush()
    else:
        user.full_name = body.full_name
        user.bar_council_number = body.bar_council_number

    return {"message": await _issue_otp(user, db)}


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email. Please create an account first.",
        )

    return {"message": await _issue_otp(user, db)}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(
    body: OTPVerify, response: Response, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    otp_result = await db.execute(
        select(OTPCode)
        .where(
            OTPCode.user_id == user.id,
            OTPCode.is_used == False,  # noqa: E712
            OTPCode.expires_at > datetime.now(UTC),
        )
        .order_by(OTPCode.created_at.desc())
        .limit(1)
    )
    otp_record = otp_result.scalar_one_or_none()

    if otp_record is None or not verify_otp(body.otp, otp_record.hashed_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

    otp_record.is_used = True
    user.is_verified = True
    await db.commit()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    _secure = settings.is_production
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=_secure,
        samesite="lax",
        max_age=3600,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=_secure,
        samesite="lax",
        max_age=86400 * 30,
    )

    profile_completed = bool(user.full_name and user.state)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        profile_completed=profile_completed,
    )


@router.post("/complete-profile", response_model=UserResponse)
async def complete_profile(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.full_name = body.full_name
    user.phone = body.phone
    user.bar_council_number = body.bar_council_number
    user.state = body.state
    user.preferred_language = body.preferred_language
    await db.commit()

    return UserResponse.model_validate(user)


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}


class ChangePasswordRequest(BaseModel):
    current_password: str | None = None
    new_password: str = Field(min_length=6)


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    if current_user.hashed_password and body.current_password:
        if not verify_otp(body.current_password, current_user.hashed_password):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.hashed_password = hash_otp(body.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}
