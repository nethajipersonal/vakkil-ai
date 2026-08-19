from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.client import Client, FeeEntry
from app.models.user import User

router = APIRouter(prefix="/clients", tags=["clients"])


class ClientCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientResponse(BaseModel):
    id: str
    full_name: str
    phone: str | None
    email: str | None
    address: str | None
    notes: str | None
    created_at: str
    total_billed: float = 0.0
    total_received: float = 0.0

    model_config = {"from_attributes": True}


class FeeCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    description: str = Field(min_length=1, max_length=500)
    entry_date: date
    client_id: str | None = None
    case_id: str | None = None
    is_received: bool = False


class FeeResponse(BaseModel):
    id: str
    amount: float
    description: str
    entry_date: str
    is_received: bool
    client_id: str | None
    case_id: str | None
    created_at: str

    model_config = {"from_attributes": True}


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    client = Client(**body.model_dump(), advocate_id=current_user.id)
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return ClientResponse(
        **{k: getattr(client, k) for k in ["id", "full_name", "phone", "email", "address", "notes"]},
        created_at=client.created_at.isoformat(),
    )


@router.get("", response_model=list[ClientResponse])
async def list_clients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ClientResponse]:
    result = await db.execute(
        select(Client)
        .where(Client.advocate_id == current_user.id)
        .order_by(Client.full_name)
    )
    clients = result.scalars().all()

    responses = []
    for client in clients:
        fee_result = await db.execute(
            select(
                func.sum(FeeEntry.amount).label("total"),
                func.sum(FeeEntry.amount).filter(FeeEntry.is_received == True).label("received"),  # noqa: E712
            ).where(FeeEntry.client_id == client.id)
        )
        row = fee_result.one()
        responses.append(ClientResponse(
            **{k: getattr(client, k) for k in ["id", "full_name", "phone", "email", "address", "notes"]},
            created_at=client.created_at.isoformat(),
            total_billed=float(row.total or 0),
            total_received=float(row.received or 0),
        ))
    return responses


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.advocate_id == current_user.id)
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientResponse(
        **{k: getattr(client, k) for k in ["id", "full_name", "phone", "email", "address", "notes"]},
        created_at=client.created_at.isoformat(),
    )


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    body: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.advocate_id == current_user.id)
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(client, field, value)
    await db.commit()
    await db.refresh(client)
    return ClientResponse(
        **{k: getattr(client, k) for k in ["id", "full_name", "phone", "email", "address", "notes"]},
        created_at=client.created_at.isoformat(),
    )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.advocate_id == current_user.id)
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    await db.delete(client)
    await db.commit()


# ── Fee entries ───────────────────────────────────────────────────────────────

@router.post("/fees", response_model=FeeResponse, status_code=status.HTTP_201_CREATED)
async def create_fee(
    body: FeeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FeeResponse:
    fee = FeeEntry(**body.model_dump(), advocate_id=current_user.id)
    db.add(fee)
    await db.commit()
    await db.refresh(fee)
    return FeeResponse(
        id=fee.id, amount=float(fee.amount), description=fee.description,
        entry_date=str(fee.entry_date), is_received=fee.is_received,
        client_id=fee.client_id, case_id=fee.case_id,
        created_at=fee.created_at.isoformat(),
    )


@router.get("/fees/all", response_model=list[FeeResponse])
async def list_fees(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[FeeResponse]:
    result = await db.execute(
        select(FeeEntry)
        .where(FeeEntry.advocate_id == current_user.id)
        .order_by(FeeEntry.entry_date.desc())
        .limit(100)
    )
    fees = result.scalars().all()
    return [
        FeeResponse(
            id=f.id, amount=float(f.amount), description=f.description,
            entry_date=str(f.entry_date), is_received=f.is_received,
            client_id=f.client_id, case_id=f.case_id,
            created_at=f.created_at.isoformat(),
        )
        for f in fees
    ]


@router.post("/{client_id}/enable-portal", response_model=ClientResponse)
async def enable_portal(
    client_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.advocate_id == current_user.id)
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    if not client.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client must have an email to enable portal access")
    client.portal_enabled = True
    await db.commit()
    await db.refresh(client)
    return ClientResponse(
        **{k: getattr(client, k) for k in ["id", "full_name", "phone", "email", "address", "notes"]},
        created_at=client.created_at.isoformat(),
    )


@router.patch("/fees/{fee_id}/mark-received", response_model=FeeResponse)
async def mark_fee_received(
    fee_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FeeResponse:
    result = await db.execute(
        select(FeeEntry).where(FeeEntry.id == fee_id, FeeEntry.advocate_id == current_user.id)
    )
    fee = result.scalar_one_or_none()
    if fee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fee entry not found")
    fee.is_received = True
    await db.commit()
    return FeeResponse(
        id=fee.id, amount=float(fee.amount), description=fee.description,
        entry_date=str(fee.entry_date), is_received=fee.is_received,
        client_id=fee.client_id, case_id=fee.case_id,
        created_at=fee.created_at.isoformat(),
    )
