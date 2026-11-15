import uuid

import pymysql

import re
import json
from fastapi import HTTPException

import cognito_admin
import repository

from schemas import UserCreate, MentorProfileCreate 
def register_user(user: UserCreate):
    print("Service: Register User")

    user_data = {
        "user_id": str(uuid.uuid4()),
        "email": str(user.email).strip().lower(),
        "full_name": user.full_name,
        "phone": user.contact_number,
        "location": user.location,
        "graduation_year": user.graduation_year,
        "program": user.program,
        "job_title": user.job_title,
        "company": user.company,
        "linkedin_url": user.linkedin_url,
        "skills": user.skills,
        "interests": user.interests,
        "bio": user.bio,
        "role": "ALUMNI",
        "status": "PENDING",
    }

    # Step 1: Create the Cognito account
    try:
        cognito_sub = cognito_admin.create_disabled_user(
            user_data["email"],
            user.password
        )
    except cognito_admin.CognitoError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail=error.message
        )

    # Step 2: Link the Cognito identity to the RDS profile
    user_data["cognito_sub"] = cognito_sub

    try:
        repository.create_user(user_data)

    except pymysql.IntegrityError:
        # Remove the Cognito account if the RDS insert fails
        cognito_admin.delete_user(user_data["email"])

        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )

    except Exception:
        cognito_admin.delete_user(user_data["email"])

        print("Service: RDS profile creation failed")

        raise HTTPException(
            status_code=500,
            detail="Registration failed. Please try again."
        )

    return {
        "message": "User registered successfully",
        "user_id": user_data["user_id"]
    }


def get_users(
    search=None,
    company=None,
    graduation_year=None,
    program=None,
    skill=None
):

    print("Service: Getting approved users")

    users = repository.get_all_users(
        search=search,
        company=company,
        graduation_year=graduation_year,
        program=program,
        skill=skill
    )

    return {
        "users": [
            {
                "user_id": user["user_id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "graduation_year": user["graduation_year"],
                "program": user["program"],
                "linkedin_url": user["linkedin_url"],
                "skills": user["skills"],
                "bio": user["bio"],
                "role": user["role"],
                "status": user["status"],
                "company": user["company"],
                "job_title": user["job_title"],
                "location": user["location"],
            }
            for user in users
        ]
    }

def approve_user(user_id: str):

    print("Service: Approving user")

    row = repository.get_user_any_status(user_id)

    if row is None:
        raise HTTPException(status_code=404, detail="User not found")

    if row["cognito_sub"]:
        try:
            cognito_admin.enable_user(row["email"])
        except cognito_admin.CognitoError as error:
            raise HTTPException(status_code=error.status_code, detail=error.message)

    repository.approve_user(user_id)

    return {"message": "User approved successfully"}

def get_user_profile(cognito_sub):

    user = repository.get_user_by_cognito_sub(
        cognito_sub
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User profile not found"
        )

    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "status": user["status"],
        "graduation_year": user["graduation_year"],
        "program": user["program"],
        "skills": user["skills"],
        "bio": user["bio"],
        "phone": user.get("phone"),
        "location": user.get("location"),
        "job_title": user.get("job_title"),
        "company": user.get("company"),
        "linkedin_url": user.get("linkedin_url"),
        "interests": user.get("interests"),
        "profile_picture_url": user.get("profile_picture_url"),
    }

def update_profile(cognito_sub: str, user):

    repository.update_user(
        cognito_sub,
        user.model_dump()
    )

    return {
        "message": "Profile updated successfully"
    }

def get_user_by_id(user_id: str):

    print("Service: Getting user profile")

    user = repository.get_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "graduation_year": user["graduation_year"],
        "program": user["program"],
        "linkedin_url": user["linkedin_url"],
        "skills": user["skills"],
        "bio": user["bio"],
        "role": user["role"],
        "status": user["status"],
        "company": user["company"],
        "job_title": user["job_title"],
        "location": user["location"],
        "interests": user["interests"],
        "profile_picture_url": user["profile_picture_url"]
    }

def get_pending_users():

    print("Service: Getting pending users")

    users = repository.get_pending_users()

    return {
        "users": [
            {
                "user_id": user["user_id"],
                "email": user["email"],
                "full_name": user["full_name"],
                "phone": user.get("phone"),
                "location": user.get("location"),
                "graduation_year": user["graduation_year"],
                "program": user["program"],
                "job_title": user.get("job_title"),
                "company": user.get("company"),
                "linkedin_url": user.get("linkedin_url"),
                "skills": user["skills"],
                "interests": user.get("interests"),
                "bio": user["bio"],
                "status": user["status"],
            }
            for user in users
        ]
    }

def reject_user(user_id: str):

    print("Service: Rejecting user")

    rows_updated = repository.reject_user(user_id)

    if rows_updated == 0:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User rejected successfully"
    }

def get_admin_stats():

    # print("Service: Getting dashboard stats")

    stats = repository.get_admin_stats()

    return {
        "total_users": stats["total_users"],
        "approved_users": stats["approved_users"],
        "pending_users": stats["pending_users"],
        "rejected_users": stats["rejected_users"],
        "admins": stats["admins"]
    }

def get_spotlights():

    print("Service: Getting spotlight stories")

    spotlights = repository.get_spotlights()

    return {
        "spotlights": [
            {
                "slide_id": item["slide_id"],
                "title": item["title"],
                "alumni_name": item["alumni_name"],
                "summary": item["summary"],
                "image_url": item["image_url"],
                "podcast_url": item["podcast_url"],
            }
            for item in spotlights
        ]
    }


def create_spotlight(data):

    print("Service: Creating spotlight")

    spotlight_id = repository.create_spotlight(data)

    return {
        "message": "Spotlight created successfully",
        "slide_id": spotlight_id
    }


def update_spotlight(slide_id, data):

    print("Service: Updating spotlight")

    rows_updated = repository.update_spotlight(
        slide_id,
        data
    )

    if rows_updated == 0:
        raise HTTPException(
            status_code=404,
            detail="Spotlight not found"
        )

    return {
        "message": "Spotlight updated successfully"
    }


def delete_spotlight(slide_id):

    print("Service: Deleting spotlight")

    rows_deleted = repository.delete_spotlight(
        slide_id
    )

    if rows_deleted == 0:
        raise HTTPException(
            status_code=404,
            detail="Spotlight not found"
        )

    return {
        "message": "Spotlight deleted successfully"
    }
_STOP_WORDS = {"and", "the", "for", "with", "of", "in", "to", "a", "an", "my", "i"}


def _terms(value):
    if not value:
        return set()
    words = (w.strip(".") for w in re.findall(r"[a-z0-9+#.]+", value.lower()))
    return {w for w in words if len(w) > 1 and w not in _STOP_WORDS}


def get_dashboard(cognito_sub: str):

    print("Service: Building dashboard")

    me = repository.get_user_by_cognito_sub(cognito_sub)

    if not me:
        raise HTTPException(status_code=404, detail="User profile not found")

    others = repository.get_dashboard_candidates(me["user_id"])

    my_terms = _terms(me.get("skills")) | _terms(me.get("interests"))
    scored = []

    for other in others:
        other_terms = _terms(other.get("skills")) | _terms(other.get("interests"))
        shared = sorted(my_terms & other_terms)
        score = len(shared) * 3
        reasons = [f"Shared interest: {t}" for t in shared[:2]]

        if me.get("program") and me["program"] == other.get("program"):
            score += 2
            reasons.append(f"Also studied {other['program']}")

        if me.get("graduation_year") and me["graduation_year"] == other.get("graduation_year"):
            score += 1
            reasons.append("Same cohort")

        if score > 0:
            scored.append((score, other, reasons))

    scored.sort(key=lambda item: item[0], reverse=True)
    picks = [(o, r) for _, o, r in scored[:3]]

    if not picks:  # nobody in common yet: show a few members instead
        picks = [(o, []) for o in others[:3]]

    return {
        "stats": {
            "network_size": len(others),
            "same_program": sum(
                1 for o in others if me.get("program") and o.get("program") == me["program"]
            ),
            "same_cohort": sum(
                1 for o in others
                if me.get("graduation_year") and o.get("graduation_year") == me["graduation_year"]
            ),
        },
        "suggested": [
            {
                "user_id": o["user_id"],
                "full_name": o["full_name"],
                "job_title": o.get("job_title"),
                "company": o.get("company"),
                "program": o.get("program"),
                "graduation_year": o.get("graduation_year"),
                "profile_picture_url": o.get("profile_picture_url"),
                "reasons": r,
            }
            for o, r in picks
        ],
    }
def get_directory(cognito_sub: str):

    print("Service: Getting directory")

    me = repository.get_user_by_cognito_sub(cognito_sub)

    if not me:
        raise HTTPException(status_code=404, detail="User profile not found")

    users = repository.get_dashboard_candidates(me["user_id"])

    return {
        "users": [
            {
                "user_id": u["user_id"],
                "full_name": u["full_name"],
                "job_title": u.get("job_title"),
                "company": u.get("company"),
                "location": u.get("location"),
                "program": u.get("program"),
                "graduation_year": u.get("graduation_year"),
                "skills": u.get("skills"),
                "profile_picture_url": u.get("profile_picture_url"),
            }
            for u in sorted(users, key=lambda u: (u["full_name"] or "").lower())
        ]
    }
#13/11/26 - Mentornship services
def get_approved_user(cognito_sub):
    user = repository.get_user_by_cognito_sub(cognito_sub)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Alumni profile not found."
        )

    if user["status"] != "APPROVED":
        raise HTTPException(
            status_code=403,
            detail="Only approved alumni can use mentorship."
        )

    return user

def save_my_mentor_profile(cognito_sub, mentor_data):
    user = get_approved_user(cognito_sub)

    # Convert the Pydantic model into a dictionary.
    mentor_dict = mentor_data.model_dump()

    # Use the database user_id, not the Cognito sub.
    repository.save_mentor_profile(
        user["user_id"],
        mentor_dict
    )

    # Retrieve the saved profile.
    profile = repository.get_mentor_by_user_id(
        user["user_id"]
    )

    if not profile:
        raise HTTPException(
            status_code=500,
            detail="Mentor profile could not be retrieved after saving."
        )

    if isinstance(profile["expertise"], str):
        profile["expertise"] = json.loads(profile["expertise"])

    profile["is_active"] = bool(profile["is_active"])

    return profile

def get_my_mentor_profile(cognito_sub):
    user = get_approved_user(cognito_sub)
    profile = repository.get_mentor_by_user_id(user["user_id"])

    if not profile or not profile["is_active"]:
        raise HTTPException(status_code=404, detail="You have not created a mentor profile yet.")

    if isinstance(profile["expertise"], str):
        profile["expertise"] = json.loads(profile["expertise"])

    profile["is_active"] = True
    return profile

def get_recommended_mentors(cognito_sub):
    current_user = get_approved_user(cognito_sub)

    mentors = repository.get_available_mentors(
        current_user["user_id"]
    )

    # Collect the logged-in user's skills and interests.
    user_terms = (
        _terms(current_user.get("skills"))
        | _terms(current_user.get("interests"))
        | _terms(current_user.get("program"))
    )
    for field in ["skills", "interests", "program"]:
        value = current_user.get(field)

        if value:
            user_terms.update(
                item.strip().casefold()
                for item in value.replace(";", ",").split(",")
                if item.strip()
            )

    results = []

    for mentor in mentors:
        expertise = mentor["expertise"]

        if isinstance(expertise, str):
            expertise = json.loads(expertise)

        # Find matching expertise.
        match_reasons = [area for area in expertise if _terms(area) & user_terms]

        results.append({
            "mentor_id": mentor["mentor_id"],
            "user_id": mentor["user_id"],
            "full_name": mentor["full_name"],
            "job_title": mentor["job_title"],
            "company": mentor["company"],
            "location": mentor["location"],
            "program": mentor["program"],
            "graduation_year": mentor["graduation_year"],
            "profile_picture_url": mentor["profile_picture_url"],
            "expertise": expertise,
            "monthly_availability": mentor["monthly_availability"],
            "bio": mentor["bio"],
            "is_active": bool(mentor["is_active"]),
            "match_reasons": match_reasons,
            "match_score": len(match_reasons)
        })

    # Rank mentors by number of matching expertise areas.
    results.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    # Remove the internal score before returning the response.
    for mentor in results:
        mentor.pop("match_score")

    return {
        "mentors": results
    }

def deactivate_my_mentor_profile(cognito_sub):
    user = get_approved_user(cognito_sub)

    affected_rows = repository.deactivate_mentor_profile(
        user["user_id"]
    )

    if affected_rows == 0:
        raise HTTPException(
            status_code=404,
            detail="No active mentor profile found."
        )

    return {
        "message": "Mentor profile deactivated successfully."
    }

def get_admin_users():
    users = repository.get_admin_users()

    return {"users": users}

def get_admin_stats():
    stats = repository.get_admin_stats()
    
    return {
        "total_users": stats["total_users"],
        "approved_users": stats["approved_users"],
        "pending_users": stats["pending_users"],
        "rejected_users": stats["rejected_users"],
        "admins": stats["admins"],
        "active_mentors": repository.get_active_mentor_count(),
        "registration_stats": [{
            "date": str(item["registration_date"]),
            "total": item["total"]} for item in repository.get_registration_stats()]
    }

def create_announcement(data, admin_email):
    announcement_id = repository.create_announcement({
        "title": data["title"],
        "message": data["message"],
        "created_by": admin_email
    })

    return {
        "message": "Announcement published successfully",
        "announcement_id": announcement_id
    }

def get_announcements():
    announcements = repository.get_announcements()

    return {
        "announcements": [
            {
                **item,
                "created_at": item["created_at"].isoformat()
            }
            for item in announcements
        ]
    }

def get_active_mentors():
    mentors = repository.get_active_mentors()

    for mentor in mentors:
        if isinstance(mentor["expertise"], str):
            mentor["expertise"] = json.loads(mentor["expertise"])

        mentor["is_active"] = True

    return {"mentors": mentors}

def update_announcement(announcement_id, data):
    if repository.update_announcement(announcement_id, data) == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement updated successfully"}


def delete_announcement(announcement_id):
    if repository.delete_announcement(announcement_id) == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted successfully"}

def get_public_home():
    counts, locations, spotlight, latest = repository.get_home_data()

    countries = set()
    for location in locations:
        country = location.split(",")[-1].strip().lower()
        if country:
            countries.add(country)

    return {
        "stats": {
            "alumni": counts["alumni"],
            "countries": len(countries),
            "mentors": repository.get_active_mentor_count(),
            "programmes": counts["programmes"],
        },
        "spotlight": spotlight,
        "latest_member": latest["full_name"] if latest else None,
    }


def admin_create_user(data):
    email = str(data.email).strip().lower()

    user_data = {
        "user_id": str(uuid.uuid4()),
        "email": email,
        "full_name": data.full_name,
        "phone": data.contact_number,
        "location": data.location,
        "graduation_year": data.graduation_year,
        "program": data.program,
        "job_title": data.job_title,
        "company": data.company,
        "linkedin_url": None,
        "skills": None,
        "interests": None,
        "bio": None,
        "role": data.role,
        "status": "APPROVED",
    }

    try:
        user_data["cognito_sub"] = cognito_admin.create_disabled_user(email, data.password)
        cognito_admin.enable_user(email)
        if data.role == "ADMIN":
            cognito_admin.add_to_group(email, "ADMIN")
    except cognito_admin.CognitoError as error:
        if error.status_code != 409:
            cognito_admin.delete_user(email)
        raise HTTPException(status_code=error.status_code, detail=error.message)

    try:
        repository.create_user(user_data)
    except pymysql.IntegrityError:
        cognito_admin.delete_user(email)
        raise HTTPException(status_code=409, detail="Email already registered")
    except Exception:
        cognito_admin.delete_user(email)
        raise HTTPException(status_code=500, detail="Could not create the user.")

    return {"message": "User created successfully", "user_id": user_data["user_id"]}