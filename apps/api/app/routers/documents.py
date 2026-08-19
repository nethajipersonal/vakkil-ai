from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.document import Document, DocumentStatus, Template
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.document import DocumentCreate, DocumentDetailResponse, DocumentResponse, TemplateResponse
from app.services.storage_service import generate_presigned_url
from app.tasks.document_tasks import generate_document_task

FREE_MONTHLY_LIMIT = 5

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/templates", response_model=list[TemplateResponse])
async def list_templates(db: AsyncSession = Depends(get_db)) -> list[TemplateResponse]:
    result = await db.execute(select(Template).where(Template.is_active == True))  # noqa: E712
    templates = result.scalars().all()
    return [TemplateResponse.model_validate(t) for t in templates]


@router.get("/templates/{slug}", response_model=TemplateResponse)
async def get_template(slug: str, db: AsyncSession = Depends(get_db)) -> TemplateResponse:
    result = await db.execute(select(Template).where(Template.slug == slug, Template.is_active == True))  # noqa: E712
    template = result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return TemplateResponse.model_validate(template)


@router.post("/generate", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_document(
    body: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    template_result = await db.execute(select(Template).where(Template.id == body.template_id))
    template = template_result.scalar_one_or_none()
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    if body.language not in template.supported_languages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Language '{body.language}' not supported for this template",
        )

    # Enforce plan limits
    sub_result = await db.execute(
        select(Subscription)
        .options(selectinload(Subscription.plan))
        .where(Subscription.user_id == current_user.id)
    )
    sub = sub_result.scalar_one_or_none()

    if sub and sub.plan and sub.plan.monthly_document_limit > 0:
        if sub.documents_used_this_period >= sub.plan.monthly_document_limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Monthly limit of {sub.plan.monthly_document_limit} documents reached. Upgrade your plan to continue.",
            )
    elif sub is None or sub.plan is None:
        # No subscription record — enforce free tier limit by counting docs this month
        start_of_month = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        count_result = await db.execute(
            select(func.count(Document.id)).where(
                Document.owner_id == current_user.id,
                Document.created_at >= start_of_month,
            )
        )
        doc_count = count_result.scalar() or 0
        if doc_count >= FREE_MONTHLY_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Free plan limit of {FREE_MONTHLY_LIMIT} documents/month reached. Upgrade to continue.",
            )

    doc = Document(
        owner_id=current_user.id,
        template_id=body.template_id,
        title=body.title,
        doc_type=template.doc_type,
        language=body.language,
        form_data=body.form_data,
        status=DocumentStatus.PENDING,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Track usage on subscription
    if sub:
        sub.documents_used_this_period += 1
        await db.commit()

    generate_document_task.delay(doc.id)

    return DocumentResponse.model_validate(doc)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    q: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentResponse]:
    query = select(Document).where(Document.owner_id == current_user.id)
    if q:
        query = query.where(Document.title.ilike(f"%{q}%"))
    query = query.order_by(Document.created_at.desc()).limit(100)
    result = await db.execute(query)
    docs = result.scalars().all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not doc.s3_pdf_key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PDF not ready yet")
    url = generate_presigned_url(doc.s3_pdf_key)
    return {"url": url}


@router.post("/{document_id}/share-with-client")
async def share_with_client(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    doc.shared_with_client = not doc.shared_with_client
    await db.commit()
    return {"shared_with_client": doc.shared_with_client}


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentDetailResponse:
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.template))
        .where(Document.id == document_id, Document.owner_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return DocumentDetailResponse.model_validate(doc)
