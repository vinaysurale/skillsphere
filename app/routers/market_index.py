from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.skill import Skill
from app.services.market_service import (
    calculate_market_indexes,
    generate_trend_data,
    get_emerging_skills,
)

router = APIRouter(prefix="/api/market", tags=["Market Index"])


@router.get("/indexes")
def get_market_indexes(db: Session = Depends(get_db)):
    """Get skill market indexes (like NIFTY but for skills)."""
    skills = db.query(Skill).all()

    # Group by category
    by_category = {}
    for s in skills:
        cat = s.category
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(s.to_dict())

    indexes = calculate_market_indexes(by_category)
    return {"indexes": indexes}


@router.get("/trends/{category:path}")
def get_trends(
    category: str,
    days: int = Query(default=30, ge=7, le=365),
    db: Session = Depends(get_db),
):
    """Get trend data for a specific skill category."""
    skills = db.query(Skill).filter(Skill.category == category).all()
    if not skills:
        return {"error": "Category not found", "data": []}

    avg_demand = sum(s.demand_score for s in skills) / len(skills)
    base_value = avg_demand * 0.4 + (sum(s.growth_score for s in skills) / len(skills)) * 0.4
    base_value *= 100  # Scale to index values

    trend_data = generate_trend_data(base_value, days)
    return {
        "category": category,
        "days": days,
        "data": trend_data,
        "current_value": trend_data[-1]["value"] if trend_data else 0,
    }


@router.get("/emerging")
def get_emerging():
    """Get emerging skills radar data."""
    return {"emerging_skills": get_emerging_skills()}


@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    """Get skill category heatmap data."""
    skills = db.query(Skill).all()

    by_category = {}
    for s in skills:
        if s.category not in by_category:
            by_category[s.category] = {"demand": [], "growth": [], "salary": []}
        by_category[s.category]["demand"].append(s.demand_score)
        by_category[s.category]["growth"].append(s.growth_score)
        by_category[s.category]["salary"].append(s.avg_salary)

    heatmap = []
    for cat, data in by_category.items():
        heatmap.append({
            "category": cat,
            "avg_demand": round(sum(data["demand"]) / len(data["demand"]), 1),
            "avg_growth": round(sum(data["growth"]) / len(data["growth"]), 1),
            "avg_salary": round(sum(data["salary"]) / len(data["salary"]), 0),
            "skill_count": len(data["demand"]),
        })

    heatmap.sort(key=lambda x: x["avg_demand"], reverse=True)
    return {"heatmap": heatmap}
