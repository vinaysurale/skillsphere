from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill
from app.routers.auth import get_current_user
from app.services.ai_service import get_career_simulation

router = APIRouter(prefix="/api/simulator", tags=["Career Simulator"])


class SimulationRequest(BaseModel):
    future_skill_ids: list[str]


class SimulationByNameRequest(BaseModel):
    future_skill_names: list[str]


@router.post("/simulate")
def simulate_career(
    data: SimulationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Simulate career outcomes by adding future skills."""
    # Get current skills
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    current = [
        {"name": us.skill.name, "demand_score": us.skill.demand_score}
        for us in user_skills if us.skill
    ]

    # Get future skills
    future = []
    for sid in data.future_skill_ids:
        skill = db.query(Skill).filter(Skill.id == sid).first()
        if skill:
            future.append({"name": skill.name, "demand_score": skill.demand_score})

    if not future:
        raise HTTPException(status_code=400, detail="No valid future skills provided")

    result = get_career_simulation(current, future, user.career_goal or "")
    result["current_skills"] = [s["name"] for s in current]
    result["future_skills"] = [s["name"] for s in future]
    return result


@router.post("/simulate-by-name")
def simulate_by_name(
    data: SimulationByNameRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Simulate career outcomes using skill names."""
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    current = [
        {"name": us.skill.name, "demand_score": us.skill.demand_score}
        for us in user_skills if us.skill
    ]

    future = []
    for name in data.future_skill_names:
        skill = db.query(Skill).filter(Skill.name.ilike(name)).first()
        if skill:
            future.append({"name": skill.name, "demand_score": skill.demand_score})

    if not future:
        raise HTTPException(status_code=400, detail="No matching skills found")

    result = get_career_simulation(current, future, user.career_goal or "")
    result["current_skills"] = [s["name"] for s in current]
    result["future_skills"] = [s["name"] for s in future]
    return result
