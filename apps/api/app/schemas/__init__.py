from app.schemas.auth import LoginRequest, OTPVerify, RegisterRequest, TokenResponse, UserCreate, UserResponse
from app.schemas.case import CaseCreate, CaseResponse, HearingCreate, HearingResponse
from app.schemas.document import DocumentCreate, DocumentResponse, TemplateResponse

__all__ = [
    "RegisterRequest", "LoginRequest", "OTPVerify", "TokenResponse", "UserCreate", "UserResponse",
    "DocumentCreate", "DocumentResponse", "TemplateResponse",
    "CaseCreate", "CaseResponse", "HearingCreate", "HearingResponse",
]
