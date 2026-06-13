from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.user_skill import UserSkill
from app.models.career_path import CareerPath
from app.routers.auth import get_current_user
from app.services.ai_service import get_ai_recommendations, get_ai_roadmap
from app.services.gap_service import analyze_skill_gap

router = APIRouter(prefix="/api/recommendations", tags=["AI Recommendations"])


@router.get("")
def get_recommendations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get AI-powered skill recommendations based on user profile."""
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()

    # Prepare user skills data
    user_skills_data = []
    for us in user_skills:
        if us.skill:
            user_skills_data.append({
                "name": us.skill.name,
                "category": us.skill.category,
                "proficiency": us.proficiency,
                "demand_score": us.skill.demand_score,
            })

    # Get missing skills from gap analysis if career goal is set
    missing_skills = []
    if user.career_goal:
        career_path = db.query(CareerPath).filter(
            CareerPath.name.ilike(f"%{user.career_goal}%")
        ).first()
        if career_path:
            gap = analyze_skill_gap(user_skills, career_path)
            missing_skills = [
                {"name": s["name"], "demand_score": s.get("demand_score", 0)}
                for s in gap.get("missing", [])
            ]

    result = get_ai_recommendations(user_skills_data, user.career_goal or "", missing_skills)
    return result


@router.get("/roadmap")
def get_roadmap(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a personalized learning roadmap."""
    user_skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()

    user_skills_data = [
        {"name": us.skill.name, "proficiency": us.proficiency}
        for us in user_skills if us.skill
    ]

    missing_skills = []
    if user.career_goal:
        career_path = db.query(CareerPath).filter(
            CareerPath.name.ilike(f"%{user.career_goal}%")
        ).first()
        if career_path:
            gap = analyze_skill_gap(user_skills, career_path)
            missing_skills = [
                {"name": s["name"]} for s in gap.get("missing", [])
            ]

    result = get_ai_roadmap(user_skills_data, user.career_goal or "", missing_skills)
    return result
