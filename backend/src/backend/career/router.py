from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from .bedrock_client import MODEL_ID, generate_guidance
from .mentors import find_candidates
from .schemas import CareerRequest, CareerResponse

router = APIRouter(prefix="/api/career", tags=["career-assistant"])


@router.get("/health")
def health():
    return {"status": "ok", "model": MODEL_ID}


@router.post("/recommend", response_model=CareerResponse)
def recommend(req: CareerRequest):
    candidates = find_candidates(req)
    try:
        return generate_guidance(req, candidates)
    except (ClientError, BotoCoreError) as e:
        raise HTTPException(502, f"Bedrock error: {e}")
    except (ValueError, ValidationError):
        raise HTTPException(502, "AI returned an unreadable answer. Please try again.")
