from sqlalchemy.orm import Session
from app.models.skill import Skill
from app.models.user_skill import UserSkill
from app.models.career_path import CareerPath


def calculate_portfolio_score(user_skills: list[UserSkill], all_skills: list[Skill]) -> dict:
    """
    Calculate a comprehensive portfolio score based on:
    - Skill demand scores (40%)
    - Skill growth scores (30%)  
    - Salary impact (20%)
    - Skill diversity (10%)
    """
    if not user_skills:
        return {
            "score": 0,
            "grade": "F",
            "strengths": [],
            "weaknesses": [],
            "missing_critical": [],
            "breakdown": {
                "demand": 0,
                "growth": 0,
                "salary": 0,
                "diversity": 0,
            },
        }

    # Gather user's skill objects
    skills_data = []
    for us in user_skills:
        if us.skill:
            skills_data.append({
                "skill": us.skill,
                "proficiency": us.proficiency,
            })

    if not skills_data:
        return {
            "score": 0,
            "grade": "F",
            "strengths": [],
            "weaknesses": [],
            "missing_critical": [],
            "breakdown": {"demand": 0, "growth": 0, "salary": 0, "diversity": 0},
        }

    # Calculate demand score (avg demand of user skills, weighted by proficiency)
    total_demand = sum(
        s["skill"].demand_score * (s["proficiency"] / 100) for s in skills_data
    )
    avg_demand = total_demand / len(skills_data)

    # Calculate growth score
    total_growth = sum(
        s["skill"].growth_score * (s["proficiency"] / 100) for s in skills_data
    )
    avg_growth = total_growth / len(skills_data)

    # Calculate salary impact
    max_salary = max((sk.avg_salary for sk in all_skills), default=1)
    if max_salary == 0:
        max_salary = 1
    total_salary = sum(
        (s["skill"].avg_salary / max_salary) * 100 * (s["proficiency"] / 100)
        for s in skills_data
    )
    avg_salary = total_salary / len(skills_data)

    # Calculate diversity (categories covered)
    all_categories = set(sk.category for sk in all_skills)
    user_categories = set(s["skill"].category for s in skills_data)
    diversity = (len(user_categories) / max(len(all_categories), 1)) * 100

    # Weighted final score
    final_score = (
        avg_demand * 0.4
        + avg_growth * 0.3
        + avg_salary * 0.2
        + diversity * 0.1
    )
    final_score = min(100, max(0, round(final_score, 1)))

    # Determine grade
    grade = _get_grade(final_score)

    # Find strengths (high demand + high proficiency)
    strengths = []
    for s in skills_data:
        combined = (s["skill"].demand_score + s["skill"].growth_score) / 2
        if combined >= 60 and s["proficiency"] >= 60:
            strengths.append({
                "skill_id": s["skill"].id,
                "name": s["skill"].name,
                "icon": s["skill"].icon,
                "reason": f"High demand ({s['skill'].demand_score:.0f}) + Strong proficiency ({s['proficiency']:.0f}%)",
            })

    # Find weaknesses (low proficiency in high-demand skills)
    weaknesses = []
    for s in skills_data:
        if s["skill"].demand_score >= 60 and s["proficiency"] < 50:
            weaknesses.append({
                "skill_id": s["skill"].id,
                "name": s["skill"].name,
                "icon": s["skill"].icon,
                "reason": f"High demand but low proficiency ({s['proficiency']:.0f}%)",
            })

    # Find missing critical skills (high demand skills not in portfolio)
    user_skill_ids = {s["skill"].id for s in skills_data}
    missing_critical = []
    for sk in sorted(all_skills, key=lambda x: x.demand_score, reverse=True)[:10]:
        if sk.id not in user_skill_ids and sk.demand_score >= 70:
            missing_critical.append({
                "skill_id": sk.id,
                "name": sk.name,
                "icon": sk.icon,
                "demand_score": sk.demand_score,
                "category": sk.category,
            })

    return {
        "score": final_score,
        "grade": grade,
        "strengths": strengths[:5],
        "weaknesses": weaknesses[:5],
        "missing_critical": missing_critical[:5],
        "breakdown": {
            "demand": round(avg_demand, 1),
            "growth": round(avg_growth, 1),
            "salary": round(avg_salary, 1),
            "diversity": round(diversity, 1),
        },
        "total_skills": len(skills_data),
        "categories_covered": len(user_categories),
        "total_categories": len(all_categories),
    }


def _get_grade(score: float) -> str:
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B+"
    elif score >= 60:
        return "B"
    elif score >= 50:
        return "C"
    elif score >= 40:
        return "D"
    else:
        return "F"
