"""Run one task at a time:
   uv run python test_career.py mentors
   uv run python test_career.py bedrock
   uv run python test_career.py full
"""
import sys

from backend.career.bedrock_client import MODEL_ID, ask_model, generate_guidance
from backend.career.mentors import find_candidates, load_alumni
from backend.career.schemas import CareerRequest

REQ = CareerRequest(
    education="BSc Computer Engineering",
    skills=["Python", "SQL"],
    interests=["cloud", "data"],
    experience_level="entry",
    target_role="Cloud Engineer",
)


def test_mentors():
    alumni = load_alumni()
    assert len(alumni) > 0, "alumni.json is empty or not found"
    cands = find_candidates(REQ)
    print(f"{len(alumni)} alumni loaded. Top candidates:")
    for c in cands:
        print(" -", c["name"] or "(NO NAME - fix field names in describe())", "|", c["role"], "|", c["company"])
    assert all(c["name"] for c in cands), "Names missing: update describe() in mentors.py"
    print("PASS mentors")


def test_bedrock():
    print("Model:", MODEL_ID)
    print(ask_model("Reply with the single word: ready"))
    print("PASS bedrock")


def test_full():
    result = generate_guidance(REQ, find_candidates(REQ))
    print(result.model_dump_json(indent=2))
    assert result.skills_to_learn and result.roadmap
    print("PASS full")


if __name__ == "__main__":
    {"mentors": test_mentors, "bedrock": test_bedrock, "full": test_full}[sys.argv[1]]()
