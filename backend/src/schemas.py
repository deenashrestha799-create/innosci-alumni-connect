from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal

class UserCreate(BaseModel):

    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    contact_number: str = Field(min_length=5, max_length=40)
    location: str = Field(min_length=2, max_length=150)
    graduation_year: int | None = Field(default=None, ge=1950, le=2035)
    program: str | None = Field(default=None, max_length=150)
    job_title: str | None = Field(default=None, max_length=150)
    company: str | None = Field(default=None, max_length=150)
    linkedin_url: str | None = Field(default=None, max_length=255)
    skills: str | None = Field(default=None, max_length=500)
    interests: str | None = Field(default=None, max_length=500)
    bio: str | None = None
    password: str = Field(min_length=8, max_length=128)
    consent: bool
    @field_validator("consent")
    @classmethod
    def consent_required(cls, value):
        if not value:
            raise ValueError("Consent is required to register.")
        return value

class UserResponse(BaseModel):

    user_id: str
    email: EmailStr
    full_name: str

    graduation_year: int | None = None
    program: str | None = None
    linkedin_url: str | None = None
    skills: str | None = None
    bio: str | None = None

    role: str
    status: str



class RegisterUserResponse(BaseModel):

    message: str
    user_id: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    graduation_year: Optional[int] = None
    program: Optional[str] = None
    linkedin_url: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    job_title: Optional[str] = None
    company: Optional[str] = None
    interests: Optional[str] = None
    profile_picture_url: Optional[str] = None


class SpotlightCreate(BaseModel):

    title: str
    alumni_name: Optional[str] = None
    summary: Optional[str] = None
    image_url: Optional[str] = None
    podcast_url: Optional[str] = None
    sort_order: int = 0
#13/11/26 - Mentornship schemas
class MentorProfileCreate(BaseModel):
    expertise: list[str] = Field(min_length=1)
    monthly_availability: int = Field(ge=1, le=100)
    bio: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("expertise")
    @classmethod
    def validate_expertise(cls, values):
        cleaned = list(dict.fromkeys(
            value.strip()
            for value in values
            if value.strip()
        ))

        if not cleaned:
            raise ValueError("Select at least one expertise area.")

        return cleaned


class MentorProfileResponse(BaseModel):
    mentor_id: int
    user_id: str
    full_name: str
    job_title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    program: Optional[str] = None
    graduation_year: Optional[int] = None
    profile_picture_url: Optional[str] = None
    expertise: list[str]
    monthly_availability: int
    bio: Optional[str] = None
    is_active: bool
    match_reasons: list[str] = Field(default_factory=list)

class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    message: str = Field(min_length=3, max_length=2000)

class AdminUserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=150)
    role: Literal["ALUMNI", "ADMIN"] = "ALUMNI"
    password: str = Field(min_length=8, max_length=128)
    contact_number: str | None = Field(default=None, max_length=40)
    location: str | None = Field(default=None, max_length=150)
    graduation_year: int | None = Field(default=None, ge=1950, le=2035)
    program: str | None = Field(default=None, max_length=150)
    job_title: str | None = Field(default=None, max_length=150)
    company: str | None = Field(default=None, max_length=150)