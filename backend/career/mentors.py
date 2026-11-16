"""Reads content/alumni.json (read-only) and finds mentor candidates."""
import json
import re
from functools import lru_cache
from pathlib import Path

from .schemas import CareerRequest

# career/ -> backend/ (pkg) -> src/ -> backend/ (folder) -> repo root
ALUMNI_FILE = Path(__file__).resolve().parents[4] / "content" / "alumni.json"


@lru_cache
def load_alumni() -> list[dict]:
    data = json.loads(ALUMNI_FILE.read_text(encoding="utf-8"))
    if isinstance(data, dict):  # e.g. {"alumni": [...]}
        for value in data.values():
            if isinstance(value, list):
                return value
        return []
    return data


def _pick(record: dict, *keys: str) -> str:
    for key in keys:
        if record.get(key):
            return str(record[key])
    return ""


def describe(record: dict) -> dict:
    # >>> If your alumni.json uses other field names, add them here <<<
    return {
        "name": _pick(record, "name", "fullName", "full_name"),
        "role": _pick(record, "role", "title", "jobTitle", "position", "currentRole"),
        "company": _pick(record, "company", "organization", "employer"),
    }


def find_candidates(req: CareerRequest, limit: int = 6) -> list[dict]:
    words = " ".join([req.target_role, *req.skills, *req.interests]).lower()
    tokens = {t for t in re.findall(r"[a-z0-9+#.]+", words) if len(t) > 2}
    scored = []
    for record in load_alumni():
        text = json.dumps(record, ensure_ascii=False).lower()
        score = sum(1 for t in tokens if t in text)
        scored.append((score, record))
    scored.sort(key=lambda s: s[0], reverse=True)
    out = []
    for _, record in scored[:limit]:
        info = describe(record)
        info["details"] = json.dumps(record, ensure_ascii=False)[:400]
        out.append(info)
    return out
