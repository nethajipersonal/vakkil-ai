import asyncio
import logging
from datetime import UTC, date, timedelta

import resend
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.case import Hearing
from app.models.subscription import Subscription
from app.models.user import User
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="reset_monthly_document_counts")
def reset_monthly_document_counts() -> dict[str, int]:
    return asyncio.get_event_loop().run_until_complete(_reset_counts())


async def _reset_counts() -> dict[str, int]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Subscription))
        subs = result.scalars().all()
        for sub in subs:
            sub.documents_used_this_period = 0
        await db.commit()
        count = len(subs)
    logger.info("Monthly reset: zeroed document counts for %d subscriptions", count)
    return {"reset": count}


@celery_app.task(name="send_hearing_reminders")
def send_hearing_reminders() -> dict[str, int]:
    return asyncio.get_event_loop().run_until_complete(_send_reminders())


async def _send_reminders() -> dict[str, int]:
    tomorrow = date.today() + timedelta(days=1)
    sent = 0
    failed = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Hearing)
            .options(selectinload(Hearing.case))
            .where(Hearing.hearing_date == tomorrow, Hearing.reminder_sent == False)  # noqa: E712
        )
        hearings = result.scalars().all()

        for hearing in hearings:
            case = hearing.case
            user_result = await db.execute(
                select(User).where(User.id == case.advocate_id)
            )
            user = user_result.scalar_one_or_none()
            if user is None:
                continue

            try:
                await _send_reminder_email(
                    email=user.email,
                    advocate_name=user.full_name or "Advocate",
                    case_type=case.case_type,
                    case_number=case.case_number,
                    case_year=case.case_year,
                    court_name=case.court_name,
                    petitioner=case.petitioner_name,
                    respondent=case.respondent_name,
                    hearing_type=hearing.hearing_type,
                    purpose=hearing.purpose,
                    hearing_date=tomorrow,
                )
                hearing.reminder_sent = True
                sent += 1
                logger.info("Reminder sent to %s for case %s/%s", user.email, case.case_number, case.case_year)
            except Exception as e:
                failed += 1
                logger.error("Failed to send reminder for hearing %s: %s", hearing.id, e)

        await db.commit()

    logger.info("Hearing reminders: %d sent, %d failed", sent, failed)
    return {"sent": sent, "failed": failed}


async def _send_reminder_email(
    *,
    email: str,
    advocate_name: str,
    case_type: str,
    case_number: str,
    case_year: int,
    court_name: str,
    petitioner: str,
    respondent: str,
    hearing_type: str,
    purpose: str | None,
    hearing_date: date,
) -> None:
    date_str = hearing_date.strftime("%-d %B %Y")
    subject = f"நாளை கேட்பு: {case_type} {case_number}/{case_year} — {court_name}"

    html = f"""
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fff;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:24px;">
        <div style="background:#4f46e5; border-radius:10px; padding:8px;">
          <span style="color:white; font-size:18px;">⚖️</span>
        </div>
        <div>
          <p style="margin:0; font-weight:700; color:#0f172a; font-size:16px;">VaakiL AI</p>
          <p style="margin:0; color:#6366f1; font-size:12px;">வாக்கீல் AI</p>
        </div>
      </div>

      <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:12px; padding:16px 20px; margin-bottom:24px;">
        <p style="margin:0; color:#92400e; font-size:13px; font-weight:600;">📅 நாளை நீதிமன்றம் — {date_str}</p>
      </div>

      <p style="color:#334155; margin-bottom:4px;">வணக்கம் {advocate_name},</p>
      <p style="color:#64748b; font-size:14px; margin-top:0;">நாளை உங்களுக்கு ஒரு கேட்பு உள்ளது:</p>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:20px 0;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="color:#64748b; font-size:13px; padding:6px 0; width:40%;">வழக்கு எண்</td>
            <td style="color:#0f172a; font-size:13px; font-weight:600; padding:6px 0;">
              {case_type} {case_number}/{case_year}
            </td>
          </tr>
          <tr>
            <td style="color:#64748b; font-size:13px; padding:6px 0;">நீதிமன்றம்</td>
            <td style="color:#0f172a; font-size:13px; padding:6px 0;">{court_name}</td>
          </tr>
          <tr>
            <td style="color:#64748b; font-size:13px; padding:6px 0;">வழக்கு</td>
            <td style="color:#0f172a; font-size:13px; padding:6px 0;">{petitioner} vs {respondent}</td>
          </tr>
          <tr>
            <td style="color:#64748b; font-size:13px; padding:6px 0;">கேட்பு வகை</td>
            <td style="color:#0f172a; font-size:13px; padding:6px 0; text-transform:capitalize;">{hearing_type}</td>
          </tr>
          {f'<tr><td style="color:#64748b; font-size:13px; padding:6px 0;">நோக்கம்</td><td style="color:#0f172a; font-size:13px; padding:6px 0;">{purpose}</td></tr>' if purpose else ''}
        </table>
      </div>

      <a href="https://vakkil.ai/cases" style="display:inline-block; background:#4f46e5; color:white; text-decoration:none; padding:12px 24px; border-radius:10px; font-size:14px; font-weight:600;">
        VaakiL AI-ல் திற →
      </a>

      <hr style="border:none; border-top:1px solid #f1f5f9; margin:28px 0;">
      <p style="color:#94a3b8; font-size:11px; margin:0;">
        இந்த reminder VaakiL AI மூலம் அனுப்பப்பட்டது. Settings-ல் reminders ஐ off செய்யலாம்.
      </p>
    </div>
    """

    if not settings.RESEND_API_KEY:
        logger.warning("DEV: Hearing reminder for %s — %s %s/%s at %s", email, case_type, case_number, case_year, court_name)
        return

    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send({
        "from": "VaakiL AI <reminders@resend.dev>",
        "to": [email],
        "subject": subject,
        "html": html,
    })
