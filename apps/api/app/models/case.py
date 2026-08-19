import uuid
from datetime import UTC, date, datetime
from enum import Enum

from sqlalchemy import Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CaseStatus(str, Enum):
    ACTIVE = "active"
    DISPOSED = "disposed"
    STAYED = "stayed"
    TRANSFERRED = "transferred"


class HearingType(str, Enum):
    ARGUMENTS = "arguments"
    EVIDENCE = "evidence"
    JUDGMENT = "judgment"
    MENTION = "mention"
    SETTLEMENT = "settlement"
    OTHER = "other"


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    advocate_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    case_number: Mapped[str] = mapped_column(String(100), nullable=False)
    case_year: Mapped[int] = mapped_column(nullable=False)
    case_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "CMA", "WP", "CRL"
    court_name: Mapped[str] = mapped_column(String(255), nullable=False)
    court_state: Mapped[str] = mapped_column(String(100), nullable=False)
    petitioner_name: Mapped[str] = mapped_column(String(500), nullable=False)
    respondent_name: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=CaseStatus.ACTIVE)
    cnr_number: Mapped[str | None] = mapped_column(String(30), nullable=True, unique=True, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    advocate: Mapped["User"] = relationship("User", back_populates="cases")  # type: ignore[name-defined]  # noqa: F821
    hearings: Mapped[list["Hearing"]] = relationship("Hearing", back_populates="case", cascade="all, delete-orphan", order_by="Hearing.hearing_date")


class Hearing(Base):
    __tablename__ = "hearings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    hearing_date: Mapped[date] = mapped_column(Date, nullable=False)
    hearing_type: Mapped[str] = mapped_column(String(50), default=HearingType.OTHER)
    purpose: Mapped[str | None] = mapped_column(String(500), nullable=True)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    reminder_sent: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    case: Mapped[Case] = relationship("Case", back_populates="hearings")
