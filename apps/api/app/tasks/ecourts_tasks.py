"""eCourts case status sync via the public CNR lookup endpoint."""

import asyncio
import logging
from datetime import date

import httpx
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.case import Case, Hearing, HearingType
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

ECOURTS_CNR_URL = "https://services.ecourts.gov.in/ecourtindia_v6/case/casestatus_cnr"
ECOURTS_DIRECT_URL = "https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VaakiL-AI/1.0)",
    "Content-Type": "application/x-www-form-urlencoded",
    "Referer": ECOURTS_DIRECT_URL,
    "X-Requested-With": "XMLHttpRequest",
}


@celery_app.task(name="sync_ecourts_case", bind=True, max_retries=2)
def sync_ecourts_case(self, case_id: str) -> dict:  # type: ignore[override]
    return asyncio.get_event_loop().run_until_complete(_sync(case_id))


async def _sync(case_id: str) -> dict:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Case).where(Case.id == case_id))
        case = result.scalar_one_or_none()
        if case is None:
            return {"error": "Case not found"}
        if not case.cnr_number:
            return {"error": "CNR number not set on this case"}

        try:
            data = await _fetch_ecourts(case.cnr_number)
        except Exception as exc:
            logger.warning("eCourts fetch failed for %s: %s", case.cnr_number, exc)
            return {"error": str(exc), "ecourts_url": _ecourts_url(case.cnr_number)}

        next_hearing_date = data.get("next_hearing_date")
        case_stage = data.get("case_stage", "")
        case_status = data.get("case_status", "")

        if next_hearing_date:
            existing = await db.execute(
                select(Hearing).where(Hearing.case_id == case_id, Hearing.hearing_date == next_hearing_date)
            )
            if existing.scalar_one_or_none() is None:
                db.add(Hearing(
                    case_id=case_id,
                    hearing_date=next_hearing_date,
                    hearing_type=HearingType.OTHER,
                    purpose=f"eCourts sync — {case_stage}" if case_stage else "eCourts sync",
                ))

        if case_status.lower() in ("disposed", "closed"):
            case.status = "disposed"

        await db.commit()

        return {
            "synced": True,
            "cnr": case.cnr_number,
            "next_hearing_date": str(next_hearing_date) if next_hearing_date else None,
            "case_stage": case_stage,
            "ecourts_url": _ecourts_url(case.cnr_number),
        }


async def _fetch_ecourts(cnr: str) -> dict:
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.post(
            ECOURTS_CNR_URL,
            data={"fcnr_number": cnr},
            headers=HEADERS,
        )
        resp.raise_for_status()
        payload = resp.json()

    result: dict = {}

    # The response structure varies by court. Try common fields.
    case_details = payload.get("case_details") or payload.get("caseDetails") or {}
    hearing_info = payload.get("hearing_details") or payload.get("caseHistory") or []

    if isinstance(hearing_info, list) and hearing_info:
        last = hearing_info[-1] if isinstance(hearing_info[-1], dict) else {}
        raw_date = last.get("next_date") or last.get("NextDate") or last.get("purpose_date") or ""
        result["next_hearing_date"] = _parse_date(raw_date)
        result["case_stage"] = last.get("purpose") or last.get("Purpose") or ""

    result["case_status"] = (
        case_details.get("case_status")
        or case_details.get("caseStatus")
        or payload.get("case_status")
        or ""
    )
    return result


def _parse_date(raw: str) -> date | None:
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d %b %Y"):
        try:
            from datetime import datetime
            return datetime.strptime(raw.strip(), fmt).date()
        except (ValueError, AttributeError):
            continue
    return None


def _ecourts_url(cnr: str) -> str:
    return f"https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&fcnr_number={cnr}"
