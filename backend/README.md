# Innosci Alumni Connect Backend

Backend service for the Innosci Alumni Connect application.

Stack:

- FastAPI
- MySQL
- AWS Cognito Authentication
- JWT Authorization

---

# Local Setup

## 1. Clone repository

```bash
git clone <repository-url>
cd backend
```

---

## 2. Install dependencies

This project uses **uv**.

Install dependencies:

```bash
uv sync
```

This creates and manages the project virtual environment.

---

## 3. Configure environment variables

Create `.env` file in the backend directory:

```env
DB_HOST=<mysql-host>
DB_USER=<mysql-user>
DB_PASSWORD=<mysql-password>
DB_NAME=innosci

COGNITO_REGION=<aws-region>
COGNITO_USER_POOL_ID=<user-pool-id>
COGNITO_CLIENT_ID=<client-id>
```

---

## 4. Run backend

```bash
uv run uvicorn backend.main:app --reload
```

Backend:

```
http://127.0.0.1:8000
```

---

# API Documentation

Swagger UI:

```
http://127.0.0.1:8000/docs
```

Use Swagger for:

- API endpoints
- Request payloads
- Responses
- Testing APIs

Swagger is the source of truth for the API contract.

---

# Cognito Authentication Testing

A test script is available:

```
test_cognito.py
```

Run:

```bash
uv run python test_cognito.py
```

The script authenticates with Cognito and returns an access token.

To test protected APIs:

1. Open:

```
http://127.0.0.1:8000/docs
```

2. Click **Authorize**

3. Enter:

```
Bearer <access_token>
```

Example:

```
Bearer eyJxxxxxxxx
```

---

# Authentication Flow

```
Frontend / Test Client
        |
        | Login with SPA App Client
        |
        v
AWS Cognito
        |
        | JWT Access Token
        |
        v
FastAPI Backend
        |
        | verify_token()
        |
        v
MySQL User Lookup
        |
        v
/me response
```

Protected requests must include:

```
Authorization: Bearer <token>
```

---

# Available Features

Current backend supports:

- User registration
- Cognito authentication
- User profiles
- Profile updates
- Alumni directory and search
- Admin approval workflow
- Admin dashboard statistics
- Alumni Spotlight carousel

---

# Full architecture

```
                         ┌───────────────┐
                         │     USER      │
                         │   Browser     │
                         └───────┬───────┘
                                 │
                                 ▼

                  ┌────────────────────────┐
                  │       FRONTEND         │
                  │   React Application    │
                  │  (AWS cloudfront + s3) │
                  │                        │
                  │ - Login / Signup       │
                  │ - Profile              │
                  │ - Search               │
                  │ - Spotlight Carousel   │
                  │ - Admin Screens        │
                  └───────────┬────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              │ Authentication                │ API Requests
              │                               │ JWT Token
              ▼                               ▼

       ┌───────────────┐          ┌──────────────────────┐
       │ AWS COGNITO   │          │   FASTAPI BACKEND    │
       │               │          │ Elastic Beanstalk    │
       │ - Signup      │          │                      │
       │ - Login       │          │ - API Endpoints      │
       │ - JWT Tokens  │          │ - JWT Verification   │
       │               │          │ - Business Logic     │
       └───────────────┘          │ - User Management    │
                                  │ - Admin Workflow     │
                                  │ - Spotlight APIs     │
                                  └──────────┬───────────┘
                                             │
                                             │ SQL
                                             ▼

                                  ┌──────────────────────┐
                                  │      MYSQL DB        │
                                  │       (RDS)          │
                                  │                      │
                                  │ Tables:              │
                                  │ - users              │
                                  │ - spotlight          │
                                  └──────────────────────┘
```


---

# Frontend Notes

- Users appear in the directory only after admin approval.
- Admin endpoints require an ADMIN Cognito token.
- Spotlight APIs provide homepage carousel content.
- Always refer to Swagger for the latest API definitions.

## Backend (FastAPI + MySQL)

The backend is a REST API built with FastAPI. It stores data in a MySQL database on AWS RDS and uses Amazon Cognito to identify who is calling.

### Tech stack
| Part                  | Technology |
|------                 |-----------|
| API framework         | FastAPI, run with Uvicorn |
| Data validation       | Pydantic |
| Database              | MySQL (AWS RDS), accessed with PyMySQL |
| Authentication        | Amazon Cognito tokens (checked in `auth/`) |
| Configuration         | `.env` file loaded with python-dotenv |

### Project structure
```
backend/
├── .env                  # Database settings (never commit this)
├── pyproject.toml
└── src/backend/
    ├── main.py           # API routes and CORS setup
    ├── schemas.py        # Request and response shapes (validation)
    ├── services.py       # Business logic
    ├── repository.py     # SQL queries
    ├── db_utils.py       # Gives the repository a database connection
    ├── database.py       # Creates the MySQL connection from .env
    └── auth/             # Cognito token check, current user, admin check
```

### How a request flows
Each layer has one job:

```
main.py  →  services.py  →  repository.py  →  db_utils.py  →  database.py  →  MySQL
(routes)    (rules)         (SQL)             (connection)     (settings)
```

- **`main.py`** receives the request, checks the user's login and role, and calls a service.
- **`schemas.py`** validates the data before it reaches the service. Bad data returns a `422` error.
- **`services.py`** applies the rules, such as setting the status to `PENDING` or returning `404` when nothing is found.
- **`repository.py`** runs the SQL. Each function opens a connection and closes it afterwards.

### Environment variables
Create `backend/.env`:
```
DB_HOST=<your RDS endpoint>
DB_USER=<database user>
DB_PASSWORD=<database password>
DB_NAME=innosci
```
The Cognito settings used by `auth/cognito.py` also belong here.

### Running locally
1. Create and activate a virtual environment, then install the dependencies from `pyproject.toml`.
2. Make sure your public IP is allowed in the RDS security group (MySQL, port 3306).
3. From the folder that contains `main.py`, start the server:
   ```powershell
   python -m uvicorn main:app --reload --port 8000
   ```
4. Open `http://localhost:8000/docs` to try every route in the browser.

CORS currently allows the frontend at `http://localhost:5173`.

### API endpoints

| Method        | Path                  | Who can use it                                | What it does |
|--------       |------                 |----------------                               |--------------|
| GET           | `/`                   | Anyone | Shows that the API is running        |
| POST          | `/users`              | Anyone | Registers a new alumnus (status `PENDING`) |
| GET           | `/users`              | Anyone (see limitations)                      | Lists approved alumni, with filters |
| GET           | `/users/{user_id}`    | Anyone (see limitations)                      | Shows one approved alumnus |
| GET           | `/me`                 | Logged-in user                                | Shows your own profile, role and status|
| PUT           | `/me`                 | Logged-in user                                | Updates your own profile|
| GET           | `/admin/users/pending` | Admin                                        | Lists registrations waiting for approval |
| PUT           | `/admin/users/{user_id}/approve` | Admin                              | Approves a registration |
| PUT           | `/admin/users/{user_id}/reject` | Admin                               | Rejects a registration |
| GET           | `/admin/stats`        | Admin                                         | Shows user counts for the dashboard |
| GET           | `/spotlights`         | Anyone                                        | Lists the homepage spotlight stories |
| POST          | `/admin/spotlights`   | Admin                                         | Creates a spotlight story |
| PUT           | `/admin/spotlights/{slide_id}` | Admin                                | Updates a spotlight story |
| DELETE        | `/admin/spotlights/{slide_id}` | Admin                                | Deletes a spotlight story |

#### Registration (`POST /users`)
The registration form sends:

| Field                 | Required | Notes |
|-------                |----------|-------|
| `email`               | Yes | Must be a valid email. Saved in lowercase |
| `full_name`           | Yes | 2 to 150 characters |
| `contact_number`      | Yes | Saved in the `phone` column |
| `location`            | Yes | |
| `password`            | Yes | 8 to 128 characters |
| `consent`             | Yes | Must be `true` |
| `graduation_year`     | No | 1950 to 2035 |
| `program`, `job_title`, `company`, `linkedin_url`, `skills`, `interests`, `bio` | No | |

The service then:
1. Creates a unique `user_id`.
2. Sets `role` to `ALUMNI` and `status` to `PENDING`.
3. Saves the row. The database records the consent time in `consent_at`.
4. Returns `{ "message": "...", "user_id": "..." }`.

If the email already exists, the API returns **409 "Email already registered"**.

#### Searching alumni (`GET /users`)
Only `APPROVED` users are returned. All filters are optional and can be combined:

| Query parameter | Matches |
|-----------------|---------|
| `search` | Part of the name or email |
| `company` | Part of the company name |
| `graduation_year` | Exact year |
| `program` | Part of the programme name |
| `skill` | Part of the skills text |

Example: `/users?program=Cloud&skill=AWS`

#### Updating your profile (`PUT /me`)
Send only the fields you want to change. Fields you leave out are not touched. You can edit your name, graduation year, programme, LinkedIn URL, skills, bio, phone, location, job title, company, interests and profile picture URL. You cannot change your role, status or email here.

#### Spotlight stories
The homepage shows at most **5** stories, ordered by `sort_order`. Admins manage them with the create, update and delete routes.

### Roles and approval
- Every user has a **role**: `ALUMNI` or `ADMIN`.
- Every user has a **status**: `PENDING` (just registered), `APPROVED` or `REJECTED`.
- Admin routes require a valid login **and** the `ADMIN` role.
- `/me` finds the user by their Cognito ID (`cognito_sub`).
- Only `APPROVED` users appear in the alumni list and public profiles.

### Database tables used
**`users`**: `user_id`, `email` (unique), `full_name`, `phone`, `location`, `graduation_year`, `program`, `job_title`, `company`, `linkedin_url`, `skills`, `interests`, `bio`, `profile_picture_url`, `role`, `status`, `cognito_sub`, `consent_at`

**`spotlight`**: `slide_id`, `title`, `alumni_name`, `summary`, `image_url`, `podcast_url`, `sort_order`

### Error responses
| Code | Meaning |
|------|---------|
| 401 / 403 | Not logged in, or not an admin |
| 404 | User or spotlight story not found |
| 409 | Email already registered |
| 422 | The data sent is invalid (a field is missing or the wrong type) |

### Current limitations (planned work)
- Registration saves the user in MySQL but does **not yet create the Cognito account**, so new users cannot log in yet. The password is received but not stored by the API. It will be passed to Cognito.
- Approving a user changes the status only. Enabling the Cognito account and sending the approval email are planned.
- `GET /users` and `GET /users/{user_id}` do not require login yet and include email addresses. They will require login, and contact details will be hidden.
- Profile picture upload (to S3) is not connected yet.

### Authentication (Amazon Cognito)

Cognito handles sign-in. The API never sees passwords at login. It only checks the token that Cognito gives the user.

#### How it works
1. The user signs in through Cognito (from the frontend) and receives an **ID token**.
2. The frontend sends it with every protected request:
   ```
   Authorization: Bearer <id-token>
   ```
3. The API (`auth/cognito.py`) checks the token:
   - the signature, using Cognito's public keys for the user pool;
   - that it was issued by our user pool;
   - that it was issued for our app client (the `audience` check).
4. If the token is missing, expired or invalid, the API returns **401**.
5. For admin routes, the API also checks that the user is in the Cognito group **`ADMIN`**. If not, it returns **403**.

Use the **ID token**, not the access token. The access token fails the audience check.

#### Two building blocks (`auth/dependencies.py`)
| Name | What it does |
|------|--------------|
| `get_current_user` | Requires a valid token and returns its details (`sub`, `email`, `cognito:groups`) |
| `require_admin` | Same as above, and also requires the `ADMIN` group |

Use them in a route like this:
```python
@app.get("/admin/stats")
def admin_stats(current_user=Depends(require_admin)):
    ...
```

#### Who is an admin
Admin access is decided by the **Cognito `ADMIN` group**, not by the `role` column in MySQL. To make someone an admin, add them to that group in the Cognito console. They must sign in again before the new group appears in their token.

#### Environment variables
Add these to `backend/.env`:
```
COGNITO_REGION=<for example eu-north-1>
COGNITO_USER_POOL_ID=<user pool id>
COGNITO_CLIENT_ID=<app client id>
```

#### Cognito setup checklist
1. Create a user pool (sign-in with email).
2. Create an app client without a client secret.
3. Create a group named `ADMIN`.
4. Add the first admin to the group by hand.

#### Extra Python packages
`python-jose[cryptography]` and `requests`.

#### Notes
- When the API starts, it downloads Cognito's public keys, so it needs internet access and the three variables above. Without them it will not start.
- `/me` looks up the user by the token's `sub`, which is saved in the `cognito_sub` column of `users`.
Dependencies - PyJWT[crypto]