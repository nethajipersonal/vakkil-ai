import asyncio
import logging

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.document import Document, DocumentStatus, Template
from app.services.claude_service import generate_legal_document
from app.services.pdf_service import generate_pdf
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_document_task(self, document_id: str) -> dict[str, str]:
    return asyncio.get_event_loop().run_until_complete(_generate_document(self, document_id))


async def _generate_document(task, document_id: str) -> dict[str, str]:
    async with AsyncSessionLocal() as db:
        doc_result = await db.execute(select(Document).where(Document.id == document_id))
        doc = doc_result.scalar_one_or_none()
        if doc is None:
            return {"status": "error", "message": "Document not found"}

        template_result = await db.execute(select(Template).where(Template.id == doc.template_id))
        template = template_result.scalar_one_or_none()
        if template is None:
            doc.status = DocumentStatus.FAILED
            doc.error_message = "Template not found"
            await db.commit()
            return {"status": "error", "message": "Template not found"}

        doc.status = DocumentStatus.GENERATING
        await db.commit()

        try:
            text = await generate_legal_document(
                system_prompt=template.system_prompt,
                doc_type=doc.doc_type,
                language=doc.language,
                form_data=doc.form_data,
            )
            doc.generated_text = text

            pdf_bytes = generate_pdf(text, language=doc.language)

            # Upload to S3 only when credentials are configured
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                from app.services.storage_service import upload_pdf
                s3_key = f"documents/{doc.owner_id}/{doc.id}.pdf"
                upload_pdf(pdf_bytes, s3_key)
                doc.s3_pdf_key = s3_key
            else:
                logger.warning("S3 not configured — PDF stored in DB text only (dev mode)")

            doc.status = DocumentStatus.COMPLETED

        except Exception as exc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(exc)
            await db.commit()
            raise task.retry(exc=exc)

        await db.commit()
        return {"status": "completed", "document_id": document_id}
