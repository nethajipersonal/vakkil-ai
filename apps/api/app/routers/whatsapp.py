"""Twilio WhatsApp webhook endpoint."""

import logging

from fastapi import APIRouter, Form, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document, DocumentStatus, Template
from app.models.user import User
from app.services.claude_service import generate_legal_document
from app.services.whatsapp_bot import (
    TEMPLATES,
    get_pending_generation,
    mark_generated,
    process_message,
)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])
logger = logging.getLogger(__name__)


def _twiml_reply(text: str) -> Response:
    """Return a TwiML <Message> response."""
    body = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>{text}</Message>
</Response>"""
    return Response(content=body, media_type="application/xml")


async def _send_whatsapp(to: str, body: str) -> None:
    """Send a WhatsApp message via Twilio REST API (non-reply context)."""
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN):
        logger.warning("Twilio not configured — would send to %s: %s", to, body[:80])
        return
    from twilio.rest import Client
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(body=body, from_=settings.TWILIO_WHATSAPP_FROM, to=to)


@router.post("/webhook")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """Twilio sends POST with Form fields From + Body."""
    phone = From  # e.g. "whatsapp:+919876543210"
    raw_phone = phone.replace("whatsapp:", "")

    # Resolve phone → advocate user
    result = await db.execute(select(User).where(User.phone == raw_phone, User.is_active == True))  # noqa: E712
    user = result.scalar_one_or_none()

    if user is None:
        return _twiml_reply(
            "📱 Your number is not registered with VaakiL AI.\n\n"
            "Please add your WhatsApp number in Settings and try again."
        )

    # Check if a generation just completed (poll model)
    pending = await get_pending_generation(phone)
    if pending and pending.get("state") == "generating":
        # Trigger generation inline (short documents) or return "still processing"
        try:
            reply = await _run_generation(phone, pending, db)
        except Exception as e:
            logger.error("WhatsApp generation failed: %s", e)
            reply = "❌ Generation failed. Type *menu* to try again."
        return _twiml_reply(reply)

    # Normal message processing
    reply = await process_message(phone=phone, body=Body, user_id=user.id)

    # If reply indicates ready to generate, kick off now
    if "⏳" in reply:
        new_pending = await get_pending_generation(phone)
        if new_pending:
            # Fire generation in background; respond immediately
            import asyncio
            asyncio.create_task(_generate_and_send(phone, new_pending, db, user))

    return _twiml_reply(reply)


async def _run_generation(phone: str, session: dict, db: AsyncSession) -> str:
    slug = session.get("slug", "")
    collected: dict = session.get("collected", {})
    name = session.get("name", "Document")

    result = await db.execute(select(Template).where(Template.slug == slug))
    template = result.scalar_one_or_none()
    if template is None:
        return f"❌ Template '{slug}' not found. Type *menu* to try again."

    user_id = session.get("user_id", "")
    adv_result = await db.execute(select(User).where(User.id == user_id))
    advocate = adv_result.scalar_one_or_none()
    language = advocate.preferred_language if advocate else "en"

    generated = await generate_legal_document(
        system_prompt=template.system_prompt,
        form_data=collected,
        language=language,
        doc_type=template.doc_type,
    )

    # Save document record
    doc = Document(
        owner_id=user_id,
        template_id=template.id,
        title=f"[WhatsApp] {name}",
        doc_type=template.doc_type,
        language=language,
        form_data=collected,
        status=DocumentStatus.COMPLETED,
        generated_text=generated,
    )
    db.add(doc)
    await db.commit()

    preview = generated[:600].strip()
    await mark_generated(phone, preview)

    return (
        f"✅ *{name}* ready!\n\n"
        f"{preview}{'...' if len(generated) > 600 else ''}\n\n"
        "📲 Full document saved in VaakiL AI app.\n"
        "Type *menu* to draft another."
    )


async def _generate_and_send(phone: str, session: dict, db: AsyncSession, user: User) -> None:
    try:
        reply = await _run_generation(phone, session, db)
    except Exception as e:
        logger.error("Background WhatsApp generation error: %s", e)
        reply = "❌ Generation failed. Please try again from the app."
    await _send_whatsapp(phone, reply)


@router.get("/status")
async def whatsapp_status() -> dict:
    configured = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
    wa_number = settings.TWILIO_WHATSAPP_FROM or "whatsapp:+14155238886"
    is_sandbox = "+14155238886" in wa_number
    join_code = settings.TWILIO_WHATSAPP_JOIN_CODE or "your-join-code"
    instructions = (
        [
            "Go to Twilio Console → Messaging → WhatsApp Sandbox",
            f"Set webhook URL to: https://your-api.railway.app/api/v1/whatsapp/webhook (Method: POST)",
            f"Join sandbox: send 'join {join_code}' to {wa_number} on WhatsApp",
            "Add your WhatsApp number (+91XXXXXXXXXX) in the Settings page",
            "Send 'hi' to the number to start generating documents",
        ]
        if not configured
        else (
            [
                f"Twilio is configured with number {wa_number}",
                "Set webhook URL in Twilio Console → Messaging → WhatsApp",
                "Webhook URL: https://your-api.railway.app/api/v1/whatsapp/webhook",
                "Add your mobile number in the Settings page",
                "Send 'hi' to start generating documents",
            ]
            if is_sandbox
            else [
                f"Twilio is configured with approved number {wa_number}",
                "Webhook should already be configured in Twilio Console",
                "Add your mobile number in the Settings page",
                "Message the number directly — no join code needed",
                "Send 'hi' to start generating documents",
            ]
        )
    )
    return {
        "configured": configured,
        "sandbox_number": wa_number,
        "is_sandbox": is_sandbox,
        "join_code": join_code if is_sandbox else None,
        "webhook_url": "/api/v1/whatsapp/webhook",
        "templates_available": list(TEMPLATES.keys()),
        "instructions": instructions,
    }
