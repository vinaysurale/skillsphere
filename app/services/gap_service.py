from sqlalchemy.orm import Session
from app.models.skill import Skill
from app.models.user_skill import UserSkill
from app.models.career_path import CareerPath, CareerPathSkill


def analyze_skill_gap(
    user_skills: list[UserSkill],
    career_path: CareerPath,
) -> dict:
    """
    Compare user's skills against a career path's required skills.
    Returns matched skills, missing skills, and completion percentage.
    """
    # Get user skill IDs and names
    user_skill_ids = set()
    user_skill_map = {}
    for us in user_skills:
        if us.skill:
            user_skill_ids.add(us.skill_id)
            user_skill_map[us.skill_id] = {
                "name": us.skill.name,
                "proficiency": us.proficiency,
                "icon": us.skill.icon,
                "category": us.skill.category,
            }

    # Analyze required skills
    matched = []
    missing = []
    total_required = 0
    total_matched = 0

    for cps in career_path.required_skills:
        if not cps.skill:
            continue

        skill_info = {
            "skill_id": cps.skill_id,
            "name": cps.skill.name,
            "icon": cps.skill.icon,
            "category": cps.skill.category,
            "importance": cps.importance,
            "demand_score": cps.skill.demand_score,
        }

        weight = {"Required": 3, "Recommended": 2, "Optional": 1}.get(cps.importance, 1)
        total_required += weight

        if cps.skill_id in user_skill_ids:
            user_data = user_skill_map[cps.skill_id]
            skill_info["proficiency"] = user_data["proficiency"]
            skill_info["status"] = "matched"
            matched.append(skill_info)
            # Weight by proficiency
            total_matched += weight * (user_data["proficiency"] / 100)
        else:
            skill_info["proficiency"] = 0
            skill_info["status"] = "missing"
            # Determine severity
            if cps.importance == "Required":
                skill_info["severity"] = "critical"
            elif cps.importance == "Recommended":
                skill_info["severity"] = "moderate"
            else:
                skill_info["severity"] = "optional"
            missing.append(skill_info)

    # Calculate completion percentage
    completion = (total_matched / max(total_required, 1)) * 100
    completion = min(100, round(completion, 1))

    # Sort missing by severity priority
    severity_order = {"critical": 0, "moderate": 1, "optional": 2}
    missing.sort(key=lambda x: (severity_order.get(x.get("severity", "optional"), 3), -x["demand_score"]))

    # Generate learning priority
    learning_priority = []
    for i, skill in enumerate(missing[:6]):
        priority_level = "🔴 Critical" if skill["severity"] == "critical" else (
            "🟡 Recommended" if skill["severity"] == "moderate" else "🟢 Optional"
        )
        learning_priority.append({
            "rank": i + 1,
            "name": skill["name"],
            "icon": skill["icon"],
            "priority": priority_level,
            "impact": f"Adds {skill['demand_score']:.0f} demand points",
        })

    return {
        "career_path": {
            "name": career_path.name,
            "description": career_path.description,
            "icon": career_path.icon,
            "avg_salary": career_path.avg_salary,
            "demand_level": career_path.demand_level,
        },
        "completion": completion,
        "matched_count": len(matched),
        "missing_count": len(missing),
        "total_required": len(career_path.required_skills),
        "matched": matched,
        "missing": missing,
        "learning_priority": learning_priority,
    }
