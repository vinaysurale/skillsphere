from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill
from app.routers.auth import get_current_user
from app.services.scoring_service import calculate_portfolio_score
from app.services.github_service import analyze_github_profile

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


class AddSkillRequest(BaseModel):
    skill_id: str
    proficiency: float = 50.0


class AddSkillByNameRequest(BaseModel):
    skill_name: str
    proficiency: float = 50.0


class UpdateProficiencyRequest(BaseModel):
    proficiency: float


@router.get("")
def get_portfolio(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the user's complete skill portfolio with scores."""
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    all_skills = db.query(Skill).all()

    portfolio = calculate_portfolio_score(user_skills, all_skills)
    portfolio["skills"] = [us.to_dict() for us in user_skills]

    return portfolio


@router.post("/skills")
def add_skill(
    data: AddSkillRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a skill to the user's portfolio."""
    # Verify skill exists
    skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # Check if already added
    existing = db.query(UserSkill).filter(
        UserSkill.user_id == user.id,
        UserSkill.skill_id == data.skill_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill already in portfolio")

    user_skill = UserSkill(
        user_id=user.id,
        skill_id=data.skill_id,
        proficiency=max(0, min(100, data.proficiency)),
    )
    db.add(user_skill)
    db.commit()

    return {"message": f"Added {skill.name} to portfolio", "skill": user_skill.to_dict()}


@router.post("/skills/by-name")
def add_skill_by_name(
    data: AddSkillByNameRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a skill to portfolio by name (case-insensitive)."""
    skill = db.query(Skill).filter(Skill.name.ilike(data.skill_name)).first()
    if not skill:
        raise HTTPException(status_code=404, detail=f"Skill '{data.skill_name}' not found in database")

    existing = db.query(UserSkill).filter(
        UserSkill.user_id == user.id,
        UserSkill.skill_id == skill.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill already in portfolio")

    user_skill = UserSkill(
        user_id=user.id,
        skill_id=skill.id,
        proficiency=max(0, min(100, data.proficiency)),
    )
    db.add(user_skill)
    db.commit()

    return {"message": f"Added {skill.name} to portfolio", "skill": user_skill.to_dict()}


@router.put("/skills/{skill_id}")
def update_skill_proficiency(
    skill_id: str,
    data: UpdateProficiencyRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update proficiency for a skill in the portfolio."""
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == user.id,
        UserSkill.skill_id == skill_id,
    ).first()
    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not in portfolio")

    user_skill.proficiency = max(0, min(100, data.proficiency))
    db.commit()

    return {"message": "Proficiency updated", "skill": user_skill.to_dict()}


@router.delete("/skills/{skill_id}")
def remove_skill(
    skill_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a skill from the portfolio."""
    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == user.id,
        UserSkill.skill_id == skill_id,
    ).first()
    if not user_skill:
        raise HTTPException(status_code=404, detail="Skill not in portfolio")

    db.delete(user_skill)
    db.commit()

    return {"message": "Skill removed from portfolio"}


@router.get("/analysis")
def get_analysis(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get detailed portfolio analysis (strengths, weaknesses, missing skills)."""
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    all_skills = db.query(Skill).all()

    return calculate_portfolio_score(user_skills, all_skills)


class VerifyGithubRequest(BaseModel):
    username: str


@router.post("/verify-github")
async def verify_github(
    data: VerifyGithubRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze user's GitHub profile and add/verify matching skills in portfolio."""
    try:
        matched_skill_names = await analyze_github_profile(data.username)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if not matched_skill_names:
        return {"message": "No matching skills found in public GitHub repositories", "skills_added": []}
        
    skills = db.query(Skill).all()
    skill_map = {s.name.lower(): s for s in skills}
    
    skills_added = []
    for name in matched_skill_names:
        skill = skill_map.get(name.lower())
        if not skill:
            continue
            
        existing = db.query(UserSkill).filter(
            UserSkill.user_id == user.id,
            UserSkill.skill_id == skill.id,
        ).first()
        
        if existing:
            existing.verified = True
            existing.proficiency = max(existing.proficiency, 60.0)
        else:
            new_skill = UserSkill(
                user_id=user.id,
                skill_id=skill.id,
                proficiency=60.0,
                verified=True
            )
            db.add(new_skill)
            skills_added.append(skill.name)
            
    db.commit()
    return {
        "message": f"Successfully analyzed profile. Verified {len(matched_skill_names)} skills.",
        "skills_added": skills_added,
        "total_matched": len(matched_skill_names)
    }

