from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    bar_council_number: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    phone: str | None = Field(default=None, pattern=r"^\+91\d{10}$")
    bar_council_number: str | None = None
    state: str | None = None
    preferred_language: str = Field(default="ta", pattern=r"^(ta|te|kn|ml|hi|mr|bn|gu|en)$")


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: str | None
    bar_council_number: str | None
    state: str | None
    preferred_language: str
    role: str
    is_verified: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    profile_completed: bool = False
