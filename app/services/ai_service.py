import json
import google.generativeai as genai
from app.config import settings


def _get_model():
    """Initialize and return the Gemini model. Returns None if API key not set."""
    if not settings.GEMINI_API_KEY:
        return None
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel("gemini-1.5-flash")


def get_ai_recommendations(
    user_skills: list[dict],
    career_goal: str,
    missing_skills: list[dict] | None = None,
) -> dict:
    """
    Get AI-powered skill recommendations.
    Falls back to rule-based system if Gemini API is not available.
    """
    model = _get_model()

    if model is None:
        return _rule_based_recommendations(user_skills, career_goal, missing_skills)

    try:
        prompt = _build_recommendation_prompt(user_skills, career_goal, missing_skills)
        response = model.generate_content(prompt)
        return _parse_ai_response(response.text)
    except Exception as e:
        print(f"AI service error: {e}")
        return _rule_based_recommendations(user_skills, career_goal, missing_skills)


def get_ai_roadmap(
    user_skills: list[dict],
    career_goal: str,
    missing_skills: list[dict] | None = None,
) -> dict:
    """Generate an AI-powered learning roadmap."""
    model = _get_model()

    if model is None:
        return _rule_based_roadmap(user_skills, career_goal, missing_skills)

    try:
        prompt = _build_roadmap_prompt(user_skills, career_goal, missing_skills)
        response = model.generate_content(prompt)
        return _parse_roadmap_response(response.text)
    except Exception as e:
        print(f"AI roadmap error: {e}")
        return _rule_based_roadmap(user_skills, career_goal, missing_skills)


def get_career_simulation(
    current_skills: list[dict],
    future_skills: list[dict],
    career_goal: str,
) -> dict:
    """Simulate career outcomes with current + future skills."""
    model = _get_model()

    if model is None:
        return _rule_based_simulation(current_skills, future_skills, career_goal)

    try:
        prompt = _build_simulation_prompt(current_skills, future_skills, career_goal)
        response = model.generate_content(prompt)
        return _parse_simulation_response(response.text)
    except Exception as e:
        print(f"AI simulation error: {e}")
        return _rule_based_simulation(current_skills, future_skills, career_goal)


# ─── Prompt Builders ──────────────────────────────────────────────────

def _build_recommendation_prompt(user_skills, career_goal, missing_skills):
    skills_str = ", ".join([s.get("name", "") for s in user_skills])
    missing_str = ", ".join([s.get("name", "") for s in (missing_skills or [])])

    return f"""You are a career advisor AI. Analyze the following and provide skill recommendations.

Current Skills: {skills_str}
Career Goal: {career_goal or 'Not specified'}
Known Missing Skills: {missing_str or 'None analyzed yet'}

Respond ONLY in valid JSON format with this exact structure:
{{
  "next_skill": {{
    "name": "skill name",
    "reason": "one sentence reason why this skill is recommended next",
    "impact": "percentage or stat showing impact, e.g. 'Unlocks 35% more ML jobs'"
  }},
  "top_recommendations": [
    {{
      "name": "skill name",
      "reason": "why this skill",
      "priority": "high/medium/low",
      "estimated_time": "e.g. 2-4 weeks"
    }}
  ],
  "career_insight": "A brief 2-3 sentence career insight about their current trajectory"
}}

Return exactly 3-5 recommendations in top_recommendations. Be specific and data-driven."""


def _build_roadmap_prompt(user_skills, career_goal, missing_skills):
    skills_str = ", ".join([s.get("name", "") for s in user_skills])
    missing_str = ", ".join([s.get("name", "") for s in (missing_skills or [])])

    return f"""You are a learning pathway designer. Create a structured learning roadmap.

Current Skills: {skills_str}
Career Goal: {career_goal or 'Software Engineer'}
Gaps: {missing_str or 'General improvement needed'}

Respond ONLY in valid JSON format:
{{
  "roadmap_title": "title of the learning path",
  "estimated_duration": "e.g. 3-6 months",
  "phases": [
    {{
      "phase": 1,
      "title": "phase title",
      "duration": "e.g. 2-3 weeks",
      "skills": ["skill1", "skill2"],
      "description": "what to learn and why",
      "resources": ["resource suggestion 1", "resource suggestion 2"]
    }}
  ],
  "summary": "A motivational summary of the roadmap"
}}

Create 3-5 phases. Be practical and specific."""


def _build_simulation_prompt(current_skills, future_skills, career_goal):
    current_str = ", ".join([s.get("name", "") for s in current_skills])
    future_str = ", ".join([s.get("name", "") for s in future_skills])

    return f"""You are a career simulation AI. Predict career outcomes.

Current Skills: {current_str}
Future Skills to Add: {future_str}
Career Goal: {career_goal or 'Not specified'}

Respond ONLY in valid JSON format:
{{
  "job_opportunity_change": "+X%",
  "salary_growth": "+X%",
  "new_roles_unlocked": ["role1", "role2", "role3"],
  "market_competitiveness": "low/medium/high/very high",
  "time_to_achieve": "e.g. 4-6 months",
  "analysis": "2-3 sentence analysis of the career trajectory change"
}}

Be realistic but encouraging with the estimates."""


# ─── Response Parsers ─────────────────────────────────────────────────

def _parse_ai_response(text: str) -> dict:
    try:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        return {
            "next_skill": {
                "name": "Docker",
                "reason": "Essential for modern deployment workflows",
                "impact": "Required by 70% of job postings",
            },
            "top_recommendations": [
                {"name": "Docker", "reason": "Container fundamentals", "priority": "high", "estimated_time": "2 weeks"},
            ],
            "career_insight": "AI could not parse the response. Showing default recommendations.",
        }


def _parse_roadmap_response(text: str) -> dict:
    try:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        return _rule_based_roadmap([], "", [])


def _parse_simulation_response(text: str) -> dict:
    try:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        return json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        return _rule_based_simulation([], [], "")


# ─── Rule-Based Fallbacks ─────────────────────────────────────────────

def _rule_based_recommendations(user_skills, career_goal, missing_skills):
    """Smart rule-based recommendations when AI is not available."""
    user_skill_names = {s.get("name", "").lower() for s in user_skills}
    goal_lower = (career_goal or "").lower()

    # Define skill relationships and recommendations
    skill_suggestions = {
        "machine learning engineer": [
            {"name": "Docker", "reason": "Unlocks 35% more ML engineering jobs", "priority": "high", "estimated_time": "2-3 weeks"},
            {"name": "AWS", "reason": "Cloud deployment is essential for production ML", "priority": "high", "estimated_time": "3-4 weeks"},
            {"name": "MLOps", "reason": "Critical for ML model lifecycle management", "priority": "high", "estimated_time": "4-6 weeks"},
            {"name": "Kubernetes", "reason": "Required for scalable ML deployments", "priority": "medium", "estimated_time": "3-4 weeks"},
            {"name": "Git", "reason": "Version control is fundamental for team collaboration", "priority": "medium", "estimated_time": "1 week"},
        ],
        "data scientist": [
            {"name": "Python", "reason": "Foundation of data science tooling", "priority": "high", "estimated_time": "4-6 weeks"},
            {"name": "SQL", "reason": "Data querying is used daily", "priority": "high", "estimated_time": "2-3 weeks"},
            {"name": "TensorFlow", "reason": "Leading deep learning framework", "priority": "medium", "estimated_time": "4-6 weeks"},
            {"name": "Tableau", "reason": "Data visualization for stakeholder communication", "priority": "medium", "estimated_time": "2 weeks"},
            {"name": "Spark", "reason": "Big data processing at scale", "priority": "medium", "estimated_time": "3-4 weeks"},
        ],
        "cloud architect": [
            {"name": "AWS", "reason": "Market-leading cloud platform", "priority": "high", "estimated_time": "6-8 weeks"},
            {"name": "Kubernetes", "reason": "Container orchestration is fundamental", "priority": "high", "estimated_time": "3-4 weeks"},
            {"name": "Terraform", "reason": "Infrastructure as Code standard", "priority": "high", "estimated_time": "3-4 weeks"},
            {"name": "Docker", "reason": "Container fundamentals", "priority": "high", "estimated_time": "2-3 weeks"},
            {"name": "CI/CD", "reason": "Automated deployment pipelines", "priority": "medium", "estimated_time": "2-3 weeks"},
        ],
    }

    # Default recommendations
    default_recs = [
        {"name": "Python", "reason": "Most versatile programming language", "priority": "high", "estimated_time": "4-6 weeks"},
        {"name": "Docker", "reason": "Container skills are universally demanded", "priority": "high", "estimated_time": "2-3 weeks"},
        {"name": "AWS", "reason": "Cloud computing is in every job description", "priority": "high", "estimated_time": "4-6 weeks"},
        {"name": "Git", "reason": "Essential collaboration tool", "priority": "medium", "estimated_time": "1 week"},
        {"name": "SQL", "reason": "Data querying is a fundamental skill", "priority": "medium", "estimated_time": "2-3 weeks"},
    ]

    # Pick recommendations based on career goal
    recs = default_recs
    for key, suggestions in skill_suggestions.items():
        if key in goal_lower:
            recs = suggestions
            break

    # Filter out skills user already has
    filtered = [r for r in recs if r["name"].lower() not in user_skill_names]
    if not filtered:
        filtered = recs[:3]

    # Use missing skills to influence recommendations
    if missing_skills:
        missing_names = {s.get("name", "").lower() for s in missing_skills}
        # Prioritize skills that are in the missing list
        prioritized = []
        others = []
        for r in filtered:
            if r["name"].lower() in missing_names:
                prioritized.append(r)
            else:
                others.append(r)
        filtered = prioritized + others

    next_skill = filtered[0] if filtered else recs[0]

    return {
        "next_skill": {
            "name": next_skill["name"],
            "reason": next_skill["reason"],
            "impact": f"Required by top employers in {career_goal or 'tech'}",
        },
        "top_recommendations": filtered[:5],
        "career_insight": f"Based on your current skills and goal of becoming a {career_goal or 'tech professional'}, "
                         f"focusing on {next_skill['name']} will significantly boost your competitiveness. "
                         f"You have {len(user_skills)} skills — adding {len(filtered[:5])} more will round out your profile.",
    }


def _rule_based_roadmap(user_skills, career_goal, missing_skills):
    """Generate a structured roadmap without AI."""
    missing_names = [s.get("name", "Skill") for s in (missing_skills or [])]

    phases = []
    if len(missing_names) >= 1:
        phases.append({
            "phase": 1,
            "title": "Foundation Building",
            "duration": "2-3 weeks",
            "skills": missing_names[:2] if missing_names else ["Python"],
            "description": "Start with the most critical foundational skills that other tools build upon.",
            "resources": ["Official documentation", "FreeCodeCamp", "YouTube tutorials"],
        })
    if len(missing_names) >= 3:
        phases.append({
            "phase": 2,
            "title": "Core Competencies",
            "duration": "3-4 weeks",
            "skills": missing_names[2:4],
            "description": "Build core technical competencies required for your target role.",
            "resources": ["Coursera courses", "Hands-on projects", "GitHub repositories"],
        })
    if len(missing_names) >= 5:
        phases.append({
            "phase": 3,
            "title": "Advanced & Specialization",
            "duration": "4-6 weeks",
            "skills": missing_names[4:6],
            "description": "Develop advanced skills and specializations that set you apart.",
            "resources": ["Advanced courses", "Open source contributions", "Personal projects"],
        })

    if not phases:
        phases = [{
            "phase": 1,
            "title": "Skill Enhancement",
            "duration": "2-4 weeks",
            "skills": ["Explore new technologies"],
            "description": "Continue building on your existing skillset and explore emerging technologies.",
            "resources": ["Tech blogs", "Conference talks", "Online courses"],
        }]

    return {
        "roadmap_title": f"Path to {career_goal or 'Career Growth'}",
        "estimated_duration": "2-4 months",
        "phases": phases,
        "summary": f"This roadmap is designed to take you from your current skills to a competitive {career_goal or 'tech professional'}. Focus on one phase at a time for the best results.",
    }


def _rule_based_simulation(current_skills, future_skills, career_goal):
    """Simulate career outcomes using rules."""
    current_count = len(current_skills)
    future_count = len(future_skills)

    # Simple heuristic calculations
    job_boost = min(300, future_count * 40 + 20)
    salary_boost = min(60, future_count * 8 + 5)

    future_names = [s.get("name", "") for s in future_skills]

    roles = []
    for name in future_names:
        name_lower = name.lower()
        if "aws" in name_lower or "cloud" in name_lower or "azure" in name_lower:
            roles.append("Cloud Engineer")
        elif "docker" in name_lower or "kubernetes" in name_lower:
            roles.append("DevOps Engineer")
        elif "ml" in name_lower or "tensorflow" in name_lower or "pytorch" in name_lower:
            roles.append("ML Engineer")
        elif "react" in name_lower or "javascript" in name_lower:
            roles.append("Frontend Developer")

    if not roles:
        roles = ["Senior Developer", "Tech Lead"]

    competitiveness = "low"
    total = current_count + future_count
    if total >= 8:
        competitiveness = "very high"
    elif total >= 6:
        competitiveness = "high"
    elif total >= 4:
        competitiveness = "medium"

    months = max(2, future_count * 1.5)

    return {
        "job_opportunity_change": f"+{job_boost}%",
        "salary_growth": f"+{salary_boost}%",
        "new_roles_unlocked": list(set(roles))[:4],
        "market_competitiveness": competitiveness,
        "time_to_achieve": f"{int(months)}-{int(months + 2)} months",
        "analysis": f"Adding {future_count} new skills to your portfolio of {current_count} skills would significantly improve your market position. "
                    f"Your competitiveness would increase to {competitiveness}, opening up roles like {', '.join(list(set(roles))[:3])}.",
    }
