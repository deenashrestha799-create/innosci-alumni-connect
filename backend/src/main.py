
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware

import services

from schemas import (
    UserCreate,
    UserResponse,
    RegisterUserResponse,
    SpotlightCreate,
    UserUpdate,
    MentorProfileCreate,
    AnnouncementCreate,
    AdminUserCreate,
)

from auth import (
    get_current_user,
    require_admin,
)

from career.router import router as career_router

app = FastAPI(
    title="Innosci Alumni Backend",
    description="Backend API for the Innosci Alumni Platform",
    version="1.0.0",
)


# -----------------------------
# Middleware and Routers
# -----------------------------

app.include_router(career_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Home
# -----------------------------

@app.get("/")
def home():
    return {
        "message": "Innosci Alumni Backend is running"
    }


# -----------------------------
# User APIs
# -----------------------------

@app.get(
    "/users",
    response_model=dict[str, list[UserResponse]]
)
def get_users(
    search: str | None = Query(None),
    company: str | None = Query(None),
    graduation_year: int | None = Query(None),
    program: str | None = Query(None),
    skill: str | None = Query(None),
):
    return services.get_users(
        search=search,
        company=company,
        graduation_year=graduation_year,
        program=program,
        skill=skill,
    )


@app.post("/users", response_model=RegisterUserResponse)
def register_user(user: UserCreate):
    return services.register_user(user)


@app.get("/users/{user_id}")
def get_user_profile(user_id: str):
    return services.get_user_by_id(user_id)


@app.get("/me")
def get_me(user=Depends(get_current_user)):
    return services.get_user_profile(user["sub"])


@app.put("/me")
def update_me(
    profile: UserUpdate,
    current_user=Depends(get_current_user),
):
    services.update_profile(
        current_user["sub"],
        profile,
    )

    return {
        "message": "Profile updated successfully"
    }


# -----------------------------
# Admin User APIs
# -----------------------------

@app.post("/admin/users")
def admin_create_user(
    data: AdminUserCreate,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.admin_create_user(data)


@app.get("/admin/users")
def admin_users(
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.get_admin_users()


@app.get("/admin/users/pending")
def get_pending_users(
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.get_pending_users()


@app.put("/admin/users/{user_id}/approve")
def approve_user(
    user_id: str,
    current_user=Depends(require_admin),
):
    return services.approve_user(user_id)


@app.put("/admin/users/{user_id}/reject")
def reject_user(
    user_id: str,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.reject_user(user_id)


@app.get("/admin/stats")
def admin_stats(
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.get_admin_stats()


# -----------------------------
# Spotlight APIs
# -----------------------------

@app.get("/spotlights")
def get_spotlights():
    return services.get_spotlights()


@app.post("/admin/spotlights")
def create_spotlight(
    data: SpotlightCreate,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.create_spotlight(
        data.model_dump()
    )


@app.put("/admin/spotlights/{slide_id}")
def update_spotlight(
    slide_id: int,
    data: SpotlightCreate,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.update_spotlight(
        slide_id,
        data.model_dump()
    )


@app.delete("/admin/spotlights/{slide_id}")
def delete_spotlight(
    slide_id: int,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.delete_spotlight(slide_id)


# -----------------------------
# Dashboard and Directory
# -----------------------------

@app.get("/dashboard")
def dashboard(
    current_user=Depends(get_current_user),
):
    return services.get_dashboard(
        current_user["sub"]
    )


@app.get("/directory")
def directory(
    current_user=Depends(get_current_user),
):
    return services.get_directory(
        current_user["sub"]
    )


# -----------------------------
# Mentorship APIs
# -----------------------------

@app.post("/mentors/me")
def save_my_mentor_profile(
    mentor_data: MentorProfileCreate,
    current_user=Depends(get_current_user),
):
    return services.save_my_mentor_profile(
        current_user["sub"],
        mentor_data,
    )


@app.get("/mentors/me")
def get_my_mentor_profile(
    current_user=Depends(get_current_user),
):
    return services.get_my_mentor_profile(
        current_user["sub"]
    )


@app.get("/mentors")
def get_recommended_mentors(
    current_user=Depends(get_current_user),
):
    return services.get_recommended_mentors(
        current_user["sub"]
    )


@app.delete("/mentors/me")
def deactivate_my_mentor_profile(
    current_user=Depends(get_current_user),
):
    return services.deactivate_my_mentor_profile(
        current_user["sub"]
    )


@app.get("/admin/mentors")
def admin_mentors(
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.get_active_mentors()


# -----------------------------
# Announcement APIs
# -----------------------------

@app.post("/admin/announcements")
def publish_announcement(
    data: AnnouncementCreate,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.create_announcement(
        data.model_dump(),
        current_user.get("email", ""),
    )


@app.get("/announcements")
def announcements():
    return services.get_announcements()


@app.put("/admin/announcements/{announcement_id}")
def edit_announcement(
    announcement_id: int,
    data: AnnouncementCreate,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.update_announcement(
        announcement_id,
        data.model_dump(),
    )


@app.delete("/admin/announcements/{announcement_id}")
def remove_announcement(
    announcement_id: int,
    current_user=Depends(get_current_user),
):
    require_admin(current_user)

    return services.delete_announcement(
        announcement_id
    )


# -----------------------------
# Public Home API
# -----------------------------

@app.get("/public/home")
def public_home():
    return services.get_public_home()

@app.get("/admin/announcements")
def admin_announcements(current_user=Depends(get_current_user)):
    require_admin(current_user)
    return services.get_admin_announcements()