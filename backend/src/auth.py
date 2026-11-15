
import os

import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import repository

REGION = os.getenv("COGNITO_REGION")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID")
CLIENT_ID = os.getenv("COGNITO_CLIENT_ID")

ISSUER = (
    f"https://cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}"
)

JWKS_URL = f"{ISSUER}/.well-known/jwks.json"

jwks_client = PyJWKClient(JWKS_URL)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=CLIENT_ID,
            issuer=ISSUER,
        )

        # Your frontend sends the Cognito ID token.
        if payload.get("token_use") != "id":
            raise HTTPException(
                status_code=401,
                detail="Invalid token type"
            )

        cognito_sub = payload.get("sub")

        if not cognito_sub:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

    except PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Could not verify authentication token"
        )

    # Get the actual role from your database.
    user = repository.get_user_by_cognito_sub(cognito_sub)

    if not user:
        raise HTTPException(
            status_code=403,
            detail="User profile not found"
        )

    if user["status"] != "APPROVED":
        raise HTTPException(
            status_code=403,
            detail="Your account is not approved"
        )

    return {
        "sub": cognito_sub,
        "email": user["email"],
        "role": user["role"],
        "status": user["status"],
    }


def require_admin(
    current_user=Depends(get_current_user)
):
    if current_user["role"] != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user
