import json
import os

import boto3
from botocore.config import Config
from dotenv import load_dotenv

from .schemas import CareerRequest, CareerResponse

load_dotenv()

REGION = os.getenv("AWS_REGION", "eu-north-1")
# Copy the exact ID / inference profile ID from the Bedrock console (Model catalog)
MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "eu.amazon.nova-lite-v1:0")

SYSTEM = """You are a career guidance assistant for InnoSCI Alumni Connect.
Give realistic, practical advice for the student's target role.
Reply with ONLY one valid JSON object, no markdown, no extra text.
Never invent URLs. Only recommend mentors from the provided alumni list, using their exact names."""

SCHEMA = """{
  "summary": "2-3 sentence assessment of where the student stands",
  "skills_to_learn": [{"name": "", "why": "", "priority": "high|medium|low"}],
  "courses": [{"title": "", "provider": "", "why": ""}],
  "roadmap": [{"step": 1, "title": "", "duration": "e.g. 4 weeks", "actions": [""]}],
  "mentors": [{"name": "exact name from list", "reason": ""}]
}
Give 5-7 skills, 4-6 courses, 5-6 roadmap steps, up to 3 mentors."""

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "bedrock-runtime",
            region_name=REGION,
            config=Config(read_timeout=120, retries={"max_attempts": 2}),
        )
    return _client


def _build_prompt(req: CareerRequest, candidates: list[dict]) -> str:
    return f"""Student profile:
- Education: {req.education}
- Current technical skills: {", ".join(req.skills) or "none listed"}
- Career interests: {", ".join(req.interests) or "none listed"}
- Experience level: {req.experience_level}
- Target job role: {req.target_role}

Alumni available as mentors:
{json.dumps(candidates, ensure_ascii=False, indent=1)}

Return JSON in exactly this shape:
{SCHEMA}"""


def _extract_json(text: str) -> dict:
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON found in model reply")
    return json.loads(text[start : end + 1])


def ask_model(prompt: str) -> str:
    resp = _get_client().converse(
        modelId=MODEL_ID,
        system=[{"text": SYSTEM}],
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 3000, "temperature": 0.3},
    )
    return resp["output"]["message"]["content"][0]["text"]


def generate_guidance(req: CareerRequest, candidates: list[dict]) -> CareerResponse:
    data = _extract_json(ask_model(_build_prompt(req, candidates)))
    result = CareerResponse.model_validate(data)

    # Fill role/company from our own data and drop any made-up mentors
    by_name = {c["name"].lower(): c for c in candidates}
    real = []
    for m in result.mentors:
        match = by_name.get(m.name.lower())
        if match:
            m.role, m.company = match["role"], match["company"]
            real.append(m)
    result.mentors = real
    return result
