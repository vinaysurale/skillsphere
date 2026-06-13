from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.skill import Skill

router = APIRouter(prefix="/api/skills", tags=["Skills"])


@router.get("")
def get_skills(
    category: str | None = None,
    search: str | None = None,
    sort_by: str = "demand_score",
    db: Session = Depends(get_db),
):
    """Get all skills, optionally filtered by category or search term."""
    query = db.query(Skill)

    if category:
        query = query.filter(Skill.category == category)

    if search:
        query = query.filter(Skill.name.ilike(f"%{search}%"))

    # Sort
    sort_column = getattr(Skill, sort_by, Skill.demand_score)
    query = query.order_by(sort_column.desc())

    skills = query.all()
    return {
        "skills": [s.to_dict() for s in skills],
        "total": len(skills),
    }


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Get all unique skill categories."""
    categories = db.query(Skill.category).distinct().all()
    return {"categories": [c[0] for c in categories]}


@router.get("/{skill_id}")
def get_skill(skill_id: str, db: Session = Depends(get_db)):
    """Get a single skill by ID."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        return {"error": "Skill not found"}, 404
    return {"skill": skill.to_dict()}
