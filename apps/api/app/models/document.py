import uuid
from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentStatus(str, Enum):
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentLanguage(str, Enum):
    TAMIL = "ta"
    TELUGU = "te"
    KANNADA = "kn"
    MALAYALAM = "ml"
    HINDI = "hi"
    MARATHI = "mr"
    BENGALI = "bn"
    GUJARATI = "gu"
    ENGLISH = "en"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    template_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("templates.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "rent_agreement", "legal_notice"
    language: Mapped[str] = mapped_column(String(10), default=DocumentLanguage.TAMIL)
    status: Mapped[str] = mapped_column(String(20), default=DocumentStatus.PENDING)
    form_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    generated_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    s3_pdf_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    s3_docx_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    shared_with_client: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    owner: Mapped["User"] = relationship("User", back_populates="documents")  # type: ignore[name-defined]  # noqa: F821
    template: Mapped["Template | None"] = relationship("Template", back_populates="documents")


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)
    supported_languages: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    form_schema: Mapped[dict] = mapped_column(JSONB, nullable=False)  # JSON Schema for the form
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)  # Claude system prompt
    is_active: Mapped[bool] = mapped_column(default=True)
    is_premium: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    documents: Mapped[list[Document]] = relationship("Document", back_populates="template")
