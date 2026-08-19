from datetime import datetime

from pydantic import BaseModel, Field


class TemplateResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    doc_type: str
    supported_languages: list[str]
    form_schema: dict
    is_premium: bool

    model_config = {"from_attributes": True}


class DocumentCreate(BaseModel):
    template_id: str
    title: str = Field(min_length=3, max_length=500)
    language: str = Field(default="ta", pattern=r"^(ta|te|kn|ml|hi|mr|bn|gu|en)$")
    form_data: dict = Field(description="Key-value pairs matching the template's form_schema")


class DocumentResponse(BaseModel):
    id: str
    title: str
    doc_type: str
    language: str
    status: str
    s3_pdf_key: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetailResponse(DocumentResponse):
    form_data: dict
    generated_text: str | None
    error_message: str | None
    template: TemplateResponse | None
