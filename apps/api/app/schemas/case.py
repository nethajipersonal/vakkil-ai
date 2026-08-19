from datetime import date, datetime

from pydantic import BaseModel, Field


class HearingCreate(BaseModel):
    hearing_date: date
    hearing_type: str = Field(default="other")
    purpose: str | None = Field(default=None, max_length=500)
    outcome: str | None = None
    next_date: date | None = None


class HearingUpdate(BaseModel):
    outcome: str | None = None
    next_date: date | None = None
    hearing_type: str | None = None
    purpose: str | None = Field(default=None, max_length=500)


class HearingResponse(BaseModel):
    id: str
    case_id: str
    hearing_date: date
    hearing_type: str
    purpose: str | None
    outcome: str | None
    next_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CaseCreate(BaseModel):
    case_number: str = Field(min_length=1, max_length=100)
    case_year: int = Field(ge=1900, le=2100)
    case_type: str = Field(min_length=1, max_length=100)
    court_name: str = Field(min_length=1, max_length=255)
    court_state: str = Field(min_length=1, max_length=100)
    petitioner_name: str = Field(min_length=1, max_length=500)
    respondent_name: str = Field(min_length=1, max_length=500)
    cnr_number: str | None = Field(default=None, max_length=30)
    notes: str | None = None


class CaseUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
    court_name: str | None = Field(default=None, max_length=255)
    cnr_number: str | None = Field(default=None, max_length=30)


class CaseResponse(BaseModel):
    id: str
    case_number: str
    case_year: int
    case_type: str
    court_name: str
    court_state: str
    petitioner_name: str
    respondent_name: str
    cnr_number: str | None
    status: str
    notes: str | None
    hearings: list[HearingResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TodayHearingResponse(BaseModel):
    hearing_id: str
    case_id: str
    case_number: str
    case_year: int
    case_type: str
    court_name: str
    petitioner_name: str
    respondent_name: str
    hearing_type: str
    purpose: str | None

    model_config = {"from_attributes": True}
