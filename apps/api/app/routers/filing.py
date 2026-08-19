"""Court e-Filing kit generator — court fees, checklists, portal links."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.case import Case
from app.models.user import User

router = APIRouter(prefix="/filing", tags=["filing"])


# Court fee tables (simplified — actual rates vary by state & court)
COURT_FEES: dict[str, dict] = {
    "WP": {"name": "Writ Petition", "fee_range": "₹200 – ₹1,000", "fixed": 250},
    "CRL": {"name": "Criminal Case", "fee_range": "₹0 – ₹500", "fixed": 50},
    "CMA": {"name": "Civil Misc. Appeal", "fee_range": "₹500 – ₹5,000", "fixed": 1000},
    "SA": {"name": "Second Appeal", "fee_range": "₹1,000 – ₹5,000", "fixed": 1500},
    "OS": {"name": "Original Suit", "fee_range": "Ad-valorem (1–7.5% of claim)", "fixed": None},
    "EP": {"name": "Execution Petition", "fee_range": "₹200 – ₹2,000", "fixed": 500},
    "IA": {"name": "Interlocutory Application", "fee_range": "₹50 – ₹200", "fixed": 100},
    "CP": {"name": "Company Petition", "fee_range": "₹2,000 – ₹10,000", "fixed": 2000},
    "BAIL": {"name": "Bail Application", "fee_range": "₹0 – ₹200", "fixed": 0},
    "OTHER": {"name": "Other", "fee_range": "₹100 – ₹500", "fixed": 100},
}

DOCUMENTS_CHECKLIST: dict[str, list[str]] = {
    "WP": [
        "Petition (4 copies)",
        "Affidavit verifying petition",
        "Vakalatnama",
        "Impugned order / GO (certified copy)",
        "Index of documents",
        "Court fee stamp",
        "Envelopes with parties' addresses",
    ],
    "CRL": [
        "Criminal petition / application (3 copies)",
        "FIR copy (certified)",
        "Charge sheet (if available)",
        "Vakalatnama",
        "Bail surety bond (if bail)",
        "Remand order copy",
        "Court fee",
    ],
    "OS": [
        "Plaint (3 copies)",
        "Vakalatnama",
        "Documents relied upon (all originals + copies)",
        "List of witnesses",
        "Court fee calculated on claim value",
        "Process fee",
    ],
    "BAIL": [
        "Bail application (3 copies)",
        "FIR copy",
        "Arrest memo",
        "Remand order",
        "Surety affidavit",
        "Property document (for surety)",
    ],
    "DEFAULT": [
        "Petition / application (3 copies)",
        "Vakalatnama",
        "Supporting documents",
        "Court fee",
        "Index of documents",
    ],
}

EFILING_PORTALS: dict[str, str] = {
    "Supreme Court": "https://efiling.sci.gov.in/",
    "Delhi High Court": "https://dhcefiling.nic.in/",
    "Bombay High Court": "https://bombayhighcourt.nic.in/",
    "Madras High Court": "https://efiling.hcmadras.tn.gov.in/",
    "Calcutta High Court": "https://calcuttahighcourt.gov.in/",
    "Karnataka High Court": "https://karhc.nic.in/",
    "eCourts (All District Courts)": "https://efiling.ecourts.gov.in/",
}


class FilingKitResponse(BaseModel):
    case_number: str
    case_type: str
    court_name: str
    court_fee_estimate: str
    court_fee_fixed: int | None
    checklist: list[str]
    covering_letter_template: str
    efiling_portal: str | None
    efiling_url: str | None
    steps: list[str]


@router.get("/case/{case_id}", response_model=FilingKitResponse)
async def get_filing_kit(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FilingKitResponse:
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.hearings))
        .where(Case.id == case_id, Case.advocate_id == current_user.id)
    )
    case = result.scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    case_type_upper = case.case_type.upper().split()[0]
    fee_info = COURT_FEES.get(case_type_upper, COURT_FEES["OTHER"])
    checklist = DOCUMENTS_CHECKLIST.get(case_type_upper, DOCUMENTS_CHECKLIST["DEFAULT"])

    # Find eFiling portal for this court
    portal_name = None
    portal_url = None
    court_lower = case.court_name.lower()
    for name, url in EFILING_PORTALS.items():
        if any(k in court_lower for k in name.lower().split()):
            portal_name = name
            portal_url = url
            break
    if portal_url is None:
        portal_name = "eCourts (All District Courts)"
        portal_url = EFILING_PORTALS["eCourts (All District Courts)"]

    covering_letter = f"""To,
The Registrar,
{case.court_name}

Sub: Filing of {case.case_type} No. {case.case_number}/{case.case_year}
     {case.petitioner_name} vs {case.respondent_name}

Sir/Madam,

Kindly receive and file the enclosed petition/application in the above case.

The court fee of Rs. ________ (in the form of ______) is enclosed herewith.

Thanking you,

Yours faithfully,

_____________________
Advocate
Enrollment No: {current_user.bar_council_number or '___'}
Date: _______"""

    steps = [
        f"1. Prepare all documents as per the checklist below",
        f"2. Calculate court fee: {fee_info['fee_range']}",
        f"3. Purchase court fee stamp from treasury / online",
        f"4. Number all pages and prepare index",
        f"5. File at {case.court_name} filing counter OR online at {portal_name}",
        f"6. Online eFiling: {portal_url}",
        f"7. Obtain filing number and diary number",
        f"8. Serve notice to opposite party (if directed)",
    ]

    return FilingKitResponse(
        case_number=case.case_number,
        case_type=case.case_type,
        court_name=case.court_name,
        court_fee_estimate=fee_info["fee_range"],
        court_fee_fixed=fee_info.get("fixed"),
        checklist=checklist,
        covering_letter_template=covering_letter,
        efiling_portal=portal_name,
        efiling_url=portal_url,
        steps=steps,
    )


@router.get("/portals")
async def list_efiling_portals(current_user: User = Depends(get_current_user)) -> list[dict]:
    return [{"name": k, "url": v} for k, v in EFILING_PORTALS.items()]


@router.get("/court-fees")
async def list_court_fees(current_user: User = Depends(get_current_user)) -> list[dict]:
    return [
        {"case_type": k, "name": v["name"], "fee_range": v["fee_range"]}
        for k, v in COURT_FEES.items()
    ]
