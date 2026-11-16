from typing import Literal

from pydantic import BaseModel, Field


class CareerRequest(BaseModel):
    education: str = Field(min_length=2, max_length=300)
    skills: list[str] = Field(default_factory=list, max_length=30)
    interests: list[str] = Field(default_factory=list, max_length=20)
    experience_level: Literal["student", "entry", "junior", "mid", "senior"]
    target_role: str = Field(min_length=2, max_length=120)


class SkillItem(BaseModel):
    name: str
    why: str
    priority: Literal["high", "medium", "low"] = "medium"


class CourseItem(BaseModel):
    title: str
    provider: str
    why: str


class RoadmapStep(BaseModel):
    step: int
    title: str
    duration: str
    actions: list[str]


class MentorItem(BaseModel):
    name: str
    role: str = ""
    company: str = ""
    reason: str


class CareerResponse(BaseModel):
    summary: str
    skills_to_learn: list[SkillItem]
    courses: list[CourseItem]
    roadmap: list[RoadmapStep]
    mentors: list[MentorItem]
