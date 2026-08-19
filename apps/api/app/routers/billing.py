import hmac
import hashlib
from datetime import UTC, datetime

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.subscription import Plan, Subscription, SubscriptionStatus
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])

rzp_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

PLAN_CONFIGS: dict[str, dict] = {
    "free": {
        "tier": "free",
        "name": "Free",
        "name_ta": "இலவசம்",
        "price_paise": 0,
        "monthly_document_limit": 5,
        "features": [
            "5 documents / month",
            "Legal Notice, Rent Agreement, Consumer Complaint",
            "Case Diary (unlimited cases)",
            "Client Directory",
            "Email hearing reminders",
        ],
    },
    "standard": {
        "tier": "standard",
        "name": "Standard",
        "name_ta": "நிலையான",
        "price_paise": 29900,
        "monthly_document_limit": 50,
        "features": [
            "50 documents / month",
            "All templates including premium",
            "WhatsApp share",
            "Priority email support",
            "Bail Application, Stay Petition",
        ],
    },
    "professional": {
        "tier": "professional",
        "name": "Professional",
        "name_ta": "தொழில்முறை",
        "price_paise": 99900,
        "monthly_document_limit": 0,
        "features": [
            "Unlimited documents",
            "All templates",
            "Bulk document generation",
            "Dedicated support",
            "Early access to new features",
        ],
    },
}


class SubscriptionResponse(BaseModel):
    plan_tier: str
    plan_name: str
    status: str
    documents_used: int
    document_limit: int
    period_end: str | None
    razorpay_key_id: str


class CreateOrderRequest(BaseModel):
    plan_tier: str


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan_tier: str


class CreateSubscriptionRequest(BaseModel):
    plan_tier: str


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionResponse:
    result = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.user_id == current_user.id)
    )
    sub = result.scalar_one_or_none()

    if sub is None or sub.plan is None:
        return SubscriptionResponse(
            plan_tier="free",
            plan_name="Free",
            status="active",
            documents_used=0,
            document_limit=5,
            period_end=None,
            razorpay_key_id=settings.RAZORPAY_KEY_ID,
        )

    return SubscriptionResponse(
        plan_tier=sub.plan.tier,
        plan_name=sub.plan.name,
        status=sub.status,
        documents_used=sub.documents_used_this_period,
        document_limit=sub.plan.monthly_document_limit,
        period_end=sub.current_period_end.isoformat() if sub.current_period_end else None,
        razorpay_key_id=settings.RAZORPAY_KEY_ID,
    )


@router.get("/plans")
async def list_plans() -> list[dict]:
    return list(PLAN_CONFIGS.values())


@router.post("/create-order")
async def create_order(
    body: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    cfg = PLAN_CONFIGS.get(body.plan_tier)
    if cfg is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan tier")
    if cfg["price_paise"] == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Free plan does not require payment")

    order = rzp_client.order.create({
        "amount": cfg["price_paise"],
        "currency": "INR",
        "notes": {"user_id": current_user.id, "plan_tier": body.plan_tier},
    })
    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "plan_tier": body.plan_tier,
        "plan_name": cfg["name"],
    }


@router.post("/verify-payment")
async def verify_payment(
    body: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    key_secret = settings.RAZORPAY_KEY_SECRET.encode()
    message = f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode()
    expected = hmac.new(key_secret, message, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

    cfg = PLAN_CONFIGS.get(body.plan_tier)
    if cfg is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan tier")

    # Find or create the Plan record
    plan_result = await db.execute(select(Plan).where(Plan.tier == body.plan_tier))
    plan = plan_result.scalar_one_or_none()
    if plan is None:
        plan = Plan(
            name=cfg["name"],
            tier=body.plan_tier,
            price_paise=cfg["price_paise"],
            monthly_document_limit=cfg["monthly_document_limit"],
            features=cfg["features"],
        )
        db.add(plan)
        await db.flush()

    # Update or create subscription
    sub_result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = sub_result.scalar_one_or_none()
    now = datetime.now(UTC)

    if sub:
        sub.plan_id = plan.id
        sub.status = SubscriptionStatus.ACTIVE
        sub.razorpay_subscription_id = body.razorpay_payment_id
        sub.current_period_start = now
        sub.documents_used_this_period = 0
    else:
        sub = Subscription(
            user_id=current_user.id,
            plan_id=plan.id,
            status=SubscriptionStatus.ACTIVE,
            razorpay_subscription_id=body.razorpay_payment_id,
            current_period_start=now,
            documents_used_this_period=0,
        )
        db.add(sub)

    await db.commit()
    return {"message": f"Payment verified. Upgraded to {cfg['name']} plan."}


@router.post("/subscription/create")
async def create_razorpay_subscription(
    body: CreateSubscriptionRequest,
    current_user: User = Depends(get_current_user),
) -> dict:
    """Create a Razorpay recurring subscription. Requires razorpay_plan_id set on the Plan."""
    cfg = PLAN_CONFIGS.get(body.plan_tier)
    if cfg is None or cfg["price_paise"] == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plan for subscription")

    # Razorpay plan_id must be created in your Razorpay dashboard and stored in .env
    import os
    rzp_plan_id = os.environ.get(f"RAZORPAY_PLAN_ID_{body.plan_tier.upper()}", "")
    if not rzp_plan_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"RAZORPAY_PLAN_ID_{body.plan_tier.upper()} not configured — set it in .env",
        )

    subscription = rzp_client.subscription.create({
        "plan_id": rzp_plan_id,
        "total_count": 12,
        "quantity": 1,
        "notify_info": {
            "notify_phone": "",
            "notify_email": current_user.email,
        },
        "notes": {"user_id": current_user.id, "plan_tier": body.plan_tier},
    })
    return {
        "subscription_id": subscription["id"],
        "short_url": subscription.get("short_url", ""),
        "status": subscription["status"],
    }


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Razorpay webhook — handles subscription.charged, subscription.cancelled events."""
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    import json
    payload = json.loads(body_bytes)
    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("subscription", {}).get("entity", {})
    rzp_sub_id = entity.get("id", "")
    user_id = (entity.get("notes") or {}).get("user_id", "")
    plan_tier = (entity.get("notes") or {}).get("plan_tier", "")

    if not user_id:
        return {"status": "ignored"}

    result = await db.execute(select(Subscription).where(Subscription.user_id == user_id))
    sub = result.scalar_one_or_none()

    if event == "subscription.charged":
        from datetime import timedelta
        now = datetime.now(UTC)
        cfg = PLAN_CONFIGS.get(plan_tier, {})
        plan_result = await db.execute(select(Plan).where(Plan.tier == plan_tier))
        plan = plan_result.scalar_one_or_none()
        if plan is None and cfg:
            plan = Plan(
                name=cfg.get("name", plan_tier),
                tier=plan_tier,
                price_paise=cfg.get("price_paise", 0),
                monthly_document_limit=cfg.get("monthly_document_limit", 0),
                features=cfg.get("features", []),
            )
            db.add(plan)
            await db.flush()

        if sub:
            sub.status = SubscriptionStatus.ACTIVE
            sub.razorpay_subscription_id = rzp_sub_id
            sub.current_period_start = now
            sub.current_period_end = now + timedelta(days=31)
            sub.documents_used_this_period = 0
            if plan:
                sub.plan_id = plan.id
        elif plan:
            sub = Subscription(
                user_id=user_id,
                plan_id=plan.id,
                status=SubscriptionStatus.ACTIVE,
                razorpay_subscription_id=rzp_sub_id,
                current_period_start=now,
                current_period_end=now + timedelta(days=31),
                documents_used_this_period=0,
            )
            db.add(sub)
        await db.commit()

    elif event in ("subscription.cancelled", "subscription.expired"):
        if sub:
            sub.status = SubscriptionStatus.CANCELED
            await db.commit()

    elif event == "subscription.paused":
        if sub:
            sub.status = SubscriptionStatus.PAUSED
            await db.commit()

    return {"status": "ok"}
