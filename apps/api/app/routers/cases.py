from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.case import Case, CaseStatus, Hearing
from app.models.user import User
from app.schemas.case import (
    CaseCreate,
    CaseResponse,
    CaseUpdate,
    HearingCreate,
    HearingResponse,
    HearingUpdate,
    TodayHearingResponse,
)

router = APIRouter(prefix="/cases", tags=["cases"])


async def _get_own_case(case_id: str, user: User, db: AsyncSession) -> Case:
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.hearings))
        .where(Case.id == case_id, Case.advocate_id == user.id)
    )
    case = result.scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.get("/today", response_model=list[TodayHearingResponse])
async def list_today_hearings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TodayHearingResponse]:
    today = date.today()
    result = await db.execute(
        select(Case, Hearing)
        .join(Hearing, Hearing.case_id == Case.id)
        .where(Case.advocate_id == current_user.id, Hearing.hearing_date == today)
        .order_by(Hearing.hearing_type)
    )
    rows = result.all()
    return [
        TodayHearingResponse(
            hearing_id=h.id,
            case_id=c.id,
            case_number=c.case_number,
            case_year=c.case_year,
            case_type=c.case_type,
            court_name=c.court_name,
            petitioner_name=c.petitioner_name,
            respondent_name=c.respondent_name,
            hearing_type=h.hearing_type,
            purpose=h.purpose,
        )
        for c, h in rows
    ]


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    body: CaseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CaseResponse:
    case = Case(**body.model_dump(), advocate_id=current_user.id)
    db.add(case)
    await db.commit()
    return CaseResponse.model_validate(await _get_own_case(case.id, current_user, db))


@router.get("", response_model=list[CaseResponse])
async def list_cases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CaseResponse]:
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.hearings))
        .where(Case.advocate_id == current_user.id)
        .order_by(Case.created_at.desc())
    )
    cases = result.scalars().all()
    return [CaseResponse.model_validate(c) for c in cases]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CaseResponse:
    case = await _get_own_case(case_id, current_user, db)
    return CaseResponse.model_validate(case)


@router.patch("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: str,
    body: CaseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CaseResponse:
    case = await _get_own_case(case_id, current_user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    await db.commit()
    await db.expire(case)
    return CaseResponse.model_validate(await _get_own_case(case_id, current_user, db))


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    case = await _get_own_case(case_id, current_user, db)
    await db.delete(case)
    await db.commit()


@router.post("/{case_id}/hearings", response_model=HearingResponse, status_code=status.HTTP_201_CREATED)
async def add_hearing(
    case_id: str,
    body: HearingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HearingResponse:
    await _get_own_case(case_id, current_user, db)
    hearing = Hearing(**body.model_dump(), case_id=case_id)
    db.add(hearing)
    await db.commit()
    await db.refresh(hearing)
    return HearingResponse.model_validate(hearing)


@router.get("/{case_id}/hearings", response_model=list[HearingResponse])
async def list_hearings(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[HearingResponse]:
    await _get_own_case(case_id, current_user, db)
    result = await db.execute(
        select(Hearing).where(Hearing.case_id == case_id).order_by(Hearing.hearing_date.desc())
    )
    return [HearingResponse.model_validate(h) for h in result.scalars().all()]


@router.patch("/{case_id}/hearings/{hearing_id}", response_model=HearingResponse)
async def update_hearing(
    case_id: str,
    hearing_id: str,
    body: HearingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HearingResponse:
    await _get_own_case(case_id, current_user, db)
    result = await db.execute(
        select(Hearing).where(Hearing.id == hearing_id, Hearing.case_id == case_id)
    )
    hearing = result.scalar_one_or_none()
    if hearing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hearing not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(hearing, field, value)
    await db.commit()
    await db.refresh(hearing)
    return HearingResponse.model_validate(hearing)


@router.delete("/{case_id}/hearings/{hearing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hearing(
    case_id: str,
    hearing_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_own_case(case_id, current_user, db)
    result = await db.execute(
        select(Hearing).where(Hearing.id == hearing_id, Hearing.case_id == case_id)
    )
    hearing = result.scalar_one_or_none()
    if hearing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hearing not found")
    await db.delete(hearing)
    await db.commit()


@router.get("/{case_id}/status-options")
async def status_options() -> list[dict[str, str]]:
    return [{"value": s.value, "label": s.value.capitalize()} for s in CaseStatus]


@router.get("/hearings/upcoming")
async def upcoming_hearings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    today = datetime.now(UTC).date()
    result = await db.execute(
        select(Case)
        .options(selectinload(Case.hearings))
        .where(Case.advocate_id == current_user.id)
    )
    cases = result.scalars().all()
    hearings = []
    for case in cases:
        for h in case.hearings:
            hdate = h.hearing_date if isinstance(h.hearing_date, date) else h.hearing_date.date()
            if hdate >= today:
                hearings.append({
                    "id": h.id,
                    "case_id": case.id,
                    "hearing_date": h.hearing_date.isoformat() if hasattr(h.hearing_date, "isoformat") else str(h.hearing_date),
                    "case_type": case.case_type,
                    "case_number": case.case_number,
                    "case_year": case.case_year,
                    "court_name": case.court_name,
                })
    hearings.sort(key=lambda x: x["hearing_date"])
    return {"hearings": hearings[:15]}


@router.post("/{case_id}/ecourts-sync")
async def ecourts_sync(
    case_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    case = await _get_own_case(case_id, current_user, db)
    if not case.cnr_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add a CNR number to this case first to enable eCourts sync",
        )
    from app.tasks.ecourts_tasks import sync_ecourts_case
    task = sync_ecourts_case.delay(case_id)
    return {"task_id": task.id, "status": "queued", "cnr": case.cnr_number}
