"""WhatsApp bot state machine via Twilio + Redis."""

import json
import logging
from datetime import date
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger(__name__)

REDIS_SESSION_TTL = 3600  # 1 hour

MENU = """👋 VaakiL AI-க்கு வரவேற்கிறோம்!

Choose a document / ஆவணம் தேர்ந்தெடுங்கள்:

1️⃣  Legal Notice
2️⃣  Rent Agreement
3️⃣  Consumer Complaint
4️⃣  Vakalatnama
5️⃣  General Affidavit
6️⃣  Cheque Bounce Notice
7️⃣  Bail Application
8️⃣  Stay Petition
9️⃣  Power of Attorney

Type a number or say *cancel* to reset."""

TEMPLATES: dict[str, dict[str, Any]] = {
    "1": {
        "slug": "legal-notice",
        "name": "Legal Notice",
        "fields": [
            ("sender_name", "Sender full name?"),
            ("sender_address", "Sender address?"),
            ("recipient_name", "Recipient full name / company?"),
            ("recipient_address", "Recipient address?"),
            ("subject", "Subject of the notice?"),
            ("details", "Brief details of grievance?"),
            ("demand", "What are you demanding?"),
            ("notice_period_days", "Days to comply? (e.g. 15)"),
        ],
    },
    "2": {
        "slug": "rent-agreement",
        "name": "Rent Agreement",
        "fields": [
            ("landlord_name", "Landlord full name?"),
            ("landlord_address", "Landlord address?"),
            ("tenant_name", "Tenant full name?"),
            ("tenant_address", "Tenant address?"),
            ("property_address", "Rental property address?"),
            ("rent_amount", "Monthly rent amount (₹)?"),
            ("security_deposit", "Security deposit (₹)?"),
            ("duration_months", "Duration in months?"),
            ("start_date", "Start date (DD/MM/YYYY)?"),
        ],
    },
    "3": {
        "slug": "consumer-complaint",
        "name": "Consumer Complaint",
        "fields": [
            ("complainant_name", "Complainant full name?"),
            ("complainant_address", "Complainant address?"),
            ("opposite_party_name", "Opposite party name?"),
            ("opposite_party_address", "Opposite party address?"),
            ("product_or_service", "Product or service name?"),
            ("purchase_date", "Purchase date?"),
            ("amount_paid", "Amount paid (₹)?"),
            ("grievance", "Describe the grievance?"),
            ("relief_sought", "What relief/compensation do you seek?"),
        ],
    },
    "4": {
        "slug": "vakalatnama",
        "name": "Vakalatnama",
        "fields": [
            ("client_name", "Client full name?"),
            ("client_address", "Client address?"),
            ("advocate_name", "Advocate full name?"),
            ("advocate_enrollment", "Bar Council enrollment no?"),
            ("court_name", "Court name?"),
            ("case_number", "Case number?"),
            ("case_year", "Case year?"),
            ("opposing_party", "Opposing party name?"),
        ],
    },
    "5": {
        "slug": "affidavit-general",
        "name": "General Affidavit",
        "fields": [
            ("deponent_name", "Deponent full name?"),
            ("deponent_age", "Deponent age?"),
            ("deponent_address", "Deponent address?"),
            ("deponent_occupation", "Occupation?"),
            ("purpose", "Purpose of affidavit?"),
            ("statement", "Statement / facts to be sworn?"),
            ("place", "Place of execution?"),
        ],
    },
    "6": {
        "slug": "cheque-bounce-notice",
        "name": "Cheque Bounce Notice",
        "fields": [
            ("payee_name", "Payee (notice sender) name?"),
            ("payee_address", "Payee address?"),
            ("drawer_name", "Drawer (accused) name?"),
            ("drawer_address", "Drawer address?"),
            ("cheque_number", "Cheque number?"),
            ("cheque_date", "Cheque date?"),
            ("cheque_amount", "Cheque amount (₹)?"),
            ("bank_name", "Bank & branch name?"),
            ("dishonour_date", "Date of dishonour?"),
            ("dishonour_reason", "Reason for dishonour?"),
        ],
    },
    "7": {
        "slug": "bail-application",
        "name": "Bail Application",
        "fields": [
            ("applicant_name", "Applicant (accused) full name?"),
            ("applicant_age", "Applicant age?"),
            ("fir_number", "FIR / case number?"),
            ("police_station", "Police station?"),
            ("offence_sections", "Sections of offence (e.g. 420 IPC)?"),
            ("court_name", "Court name?"),
            ("brief_facts", "Brief facts of the case?"),
            ("grounds_for_bail", "Grounds for granting bail?"),
        ],
    },
    "8": {
        "slug": "stay-petition",
        "name": "Stay Petition",
        "fields": [
            ("petitioner_name", "Petitioner name?"),
            ("petitioner_address", "Petitioner address?"),
            ("respondent_name", "Respondent name(s)?"),
            ("court_name", "Court where filing?"),
            ("impugned_order_date", "Date of impugned order?"),
            ("impugned_order_court", "Court that passed the order?"),
            ("case_number", "Case/appeal number?"),
            ("grounds", "Grounds for stay?"),
            ("urgency", "Urgency / irreparable harm?"),
        ],
    },
    "9": {
        "slug": "power-of-attorney",
        "name": "Power of Attorney",
        "fields": [
            ("principal_name", "Principal (grantor) full name?"),
            ("principal_address", "Principal address?"),
            ("agent_name", "Agent (holder) full name?"),
            ("agent_address", "Agent address?"),
            ("agent_relationship", "Relationship with principal?"),
            ("powers_granted", "Specific powers granted?"),
            ("duration", "Duration / validity (e.g. 1 year)?"),
        ],
    },
}


def _redis_key(phone: str) -> str:
    return f"wa:session:{phone}"


async def _get_session(redis: aioredis.Redis, phone: str) -> dict:
    raw = await redis.get(_redis_key(phone))
    if raw:
        return json.loads(raw)
    return {"state": "idle"}


async def _save_session(redis: aioredis.Redis, phone: str, session: dict) -> None:
    await redis.setex(_redis_key(phone), REDIS_SESSION_TTL, json.dumps(session))


async def _clear_session(redis: aioredis.Redis, phone: str) -> None:
    await redis.delete(_redis_key(phone))


async def process_message(phone: str, body: str, user_id: str) -> str:
    """
    Core bot logic. Returns the reply text to send back to the user.
    phone: WhatsApp number (e.g. 'whatsapp:+919876543210')
    body: incoming message text
    user_id: the advocate's user ID (resolved from phone lookup)
    """
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        return await _handle(redis, phone, body.strip(), user_id)
    finally:
        await redis.aclose()


async def _handle(redis: aioredis.Redis, phone: str, body: str, user_id: str) -> str:
    session = await _get_session(redis, phone)
    body_lower = body.lower()

    # Global commands
    if body_lower in ("cancel", "reset", "start", "menu", "hi", "hello", "help", "நமஸ்கார", "வணக்கம்"):
        await _clear_session(redis, phone)
        return MENU

    state = session.get("state", "idle")

    if state == "idle":
        if body in TEMPLATES:
            tpl = TEMPLATES[body]
            session = {
                "state": "collecting",
                "template_key": body,
                "slug": tpl["slug"],
                "name": tpl["name"],
                "fields": list(tpl["fields"]),
                "field_index": 0,
                "collected": {},
                "user_id": user_id,
            }
            await _save_session(redis, phone, session)
            first_label = tpl["fields"][0][1]
            return f"✅ *{tpl['name']}* selected.\n\n{first_label}"
        return f"Please choose a number 1-9 or type *menu*.\n\n{MENU}"

    if state == "collecting":
        fields: list[tuple[str, str]] = session["fields"]
        idx: int = session["field_index"]
        collected: dict = session["collected"]

        # Save the current field
        field_name = fields[idx][0]
        collected[field_name] = body
        idx += 1

        if idx >= len(fields):
            # All fields collected — trigger generation
            session["state"] = "generating"
            session["collected"] = collected
            await _save_session(redis, phone, session)
            return (
                f"⏳ Generating your *{session['name']}*...\n\n"
                "This takes about 30 seconds. I'll send you the draft right away!"
            )
        else:
            session["field_index"] = idx
            session["collected"] = collected
            await _save_session(redis, phone, session)
            next_label = fields[idx][1]
            progress = f"({idx}/{len(fields)})"
            return f"{progress} {next_label}"

    return f"Something went wrong. Type *menu* to start over."


async def get_pending_generation(phone: str) -> dict | None:
    """Check if a session is waiting for generation and return its data."""
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        session = await _get_session(redis, phone)
        if session.get("state") == "generating":
            return session
        return None
    finally:
        await redis.aclose()


async def mark_generated(phone: str, doc_preview: str) -> None:
    """Mark generation complete and save preview."""
    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        session = await _get_session(redis, phone)
        session["state"] = "done"
        session["preview"] = doc_preview
        await _save_session(redis, phone, session)
    finally:
        await redis.aclose()
