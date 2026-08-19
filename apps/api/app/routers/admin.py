from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.document import Document, Template
from app.models.subscription import Plan, Subscription
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

require_admin = require_role("admin", "super_admin")


class AdminUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None
    bar_council_number: str | None
    state: str | None
    is_active: bool
    role: str
    is_verified: bool
    created_at: str
    plan_tier: str = "free"
    documents_used: int = 0

    model_config = {"from_attributes": True}


class TemplateToggle(BaseModel):
    is_active: bool


class UserAdminUpdate(BaseModel):
    is_active: bool | None = None
    role: str | None = Field(default=None, pattern=r"^(super_admin|admin|advocate|staff)$")


@router.get("/stats")
async def get_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    active_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active == True))  # noqa: E712
    ).scalar() or 0
    total_docs = (await db.execute(select(func.count(Document.id)))).scalar() or 0
    paid_subs = (
        await db.execute(
            select(func.count(Subscription.id)).where(
                Subscription.status == "active",
                Subscription.plan_id.isnot(None),
            )
        )
    ).scalar() or 0

    plan_counts_result = await db.execute(
        select(Plan.tier, func.count(Subscription.id))
        .join(Subscription, Subscription.plan_id == Plan.id, isouter=True)
        .group_by(Plan.tier)
    )
    plan_breakdown = {row[0]: row[1] for row in plan_counts_result.all()}

    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_documents_generated": total_docs,
        "paid_subscriptions": paid_subs,
        "plan_breakdown": plan_breakdown,
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[AdminUserResponse]:
    result = await db.execute(
        select(User)
        .options(selectinload(User.subscription).selectinload(Subscription.plan))
        .order_by(User.created_at.desc())
        .limit(500)
    )
    users = result.scalars().all()
    out = []
    for u in users:
        sub = u.subscription
        out.append(AdminUserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone=u.phone,
            bar_council_number=u.bar_council_number,
            state=u.state,
            is_active=u.is_active,
            role=u.role,
            is_verified=u.is_verified,
            created_at=u.created_at.isoformat(),
            plan_tier=sub.plan.tier if sub and sub.plan else "free",
            documents_used=sub.documents_used_this_period if sub else 0,
        ))
    return out


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    body: UserAdminUpdate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserResponse:
    # Only super_admins can grant/revoke admin-level roles — regular admins can't escalate themselves or others
    if body.role in ("admin", "super_admin") and _admin.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only super admins can assign admin roles")

    result = await db.execute(
        select(User)
        .options(selectinload(User.subscription).selectinload(Subscription.plan))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    sub = user.subscription
    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        bar_council_number=user.bar_council_number,
        state=user.state,
        is_active=user.is_active,
        role=user.role,
        is_verified=user.is_verified,
        created_at=user.created_at.isoformat(),
        plan_tier=sub.plan.tier if sub and sub.plan else "free",
        documents_used=sub.documents_used_this_period if sub else 0,
    )


@router.get("/templates", response_model=list[dict])
async def list_templates(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    result = await db.execute(select(Template).order_by(Template.name))
    return [
        {
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "doc_type": t.doc_type,
            "is_premium": t.is_premium,
            "is_active": t.is_active,
            "supported_languages": t.supported_languages,
        }
        for t in result.scalars().all()
    ]


@router.patch("/templates/{template_id}")
async def toggle_template(
    template_id: str,
    body: TemplateToggle,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Template).where(Template.id == template_id))
    template = result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    template.is_active = body.is_active
    await db.commit()
    return {"id": template.id, "is_active": template.is_active}
