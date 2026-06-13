import math
import random
from datetime import datetime, timedelta


def calculate_market_indexes(skills_by_category: dict[str, list[dict]]) -> list[dict]:
    """
    Calculate market indexes for skill categories.
    Each index is like a stock index (AI Index, Cloud Index, etc.)
    """
    indexes = []

    for category, skills in skills_by_category.items():
        if not skills:
            continue

        # Calculate aggregate scores
        avg_demand = sum(s["demand_score"] for s in skills) / len(skills)
        avg_growth = sum(s["growth_score"] for s in skills) / len(skills)
        avg_salary = sum(s["avg_salary"] for s in skills) / len(skills)

        # Index value is a weighted composite
        index_value = round(avg_demand * 0.4 + avg_growth * 0.4 + (avg_salary / 2000) * 0.2, 2)

        # Simulate daily change
        change = round(random.uniform(-3.5, 5.0), 2)
        change_pct = round(change / max(index_value, 1) * 100, 2)

        indexes.append({
            "name": f"{category} Index",
            "category": category,
            "value": round(index_value * 100, 2),  # Scale to stock-like numbers
            "change": change,
            "change_pct": change_pct,
            "direction": "up" if change >= 0 else "down",
            "avg_demand": round(avg_demand, 1),
            "avg_growth": round(avg_growth, 1),
            "avg_salary": round(avg_salary, 0),
            "skill_count": len(skills),
            "top_skills": sorted(skills, key=lambda x: x["demand_score"], reverse=True)[:3],
        })

    # Sort by value descending
    indexes.sort(key=lambda x: x["value"], reverse=True)
    return indexes


def generate_trend_data(base_value: float, days: int = 30) -> list[dict]:
    """Generate simulated historical trend data for charts."""
    data = []
    current = base_value * 0.85  # Start lower
    now = datetime.now()

    for i in range(days):
        date = now - timedelta(days=days - i)
        # Add some realistic-looking volatility
        trend = (base_value - current) * 0.05  # Mean reversion
        noise = random.gauss(0, base_value * 0.015)
        momentum = math.sin(i / 7 * math.pi) * base_value * 0.02
        current += trend + noise + momentum
        current = max(current, base_value * 0.5)  # Floor

        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "value": round(current, 2),
        })

    return data


def get_emerging_skills() -> list[dict]:
    """Return data about emerging/trending skills."""
    emerging = [
        {
            "name": "Agentic AI",
            "category": "AI/ML",
            "growth_rate": 340,
            "maturity": "Emerging",
            "description": "Autonomous AI agents that can plan, reason, and execute complex tasks.",
            "x": 85, "y": 90, "size": 45,
        },
        {
            "name": "LLMOps",
            "category": "AI/ML",
            "growth_rate": 280,
            "maturity": "Early",
            "description": "Operations and tooling for deploying and managing large language models.",
            "x": 75, "y": 85, "size": 40,
        },
        {
            "name": "AI Security",
            "category": "Security",
            "growth_rate": 220,
            "maturity": "Growing",
            "description": "Securing AI systems against adversarial attacks and ensuring model safety.",
            "x": 65, "y": 75, "size": 35,
        },
        {
            "name": "AI Governance",
            "category": "AI/ML",
            "growth_rate": 190,
            "maturity": "Growing",
            "description": "Frameworks for responsible AI development, bias detection, and compliance.",
            "x": 55, "y": 65, "size": 30,
        },
        {
            "name": "Rust",
            "category": "Programming",
            "growth_rate": 150,
            "maturity": "Maturing",
            "description": "Systems programming language focused on safety, speed, and concurrency.",
            "x": 45, "y": 55, "size": 28,
        },
        {
            "name": "WebAssembly",
            "category": "Web Development",
            "growth_rate": 130,
            "maturity": "Growing",
            "description": "Binary instruction format for near-native performance in web browsers.",
            "x": 40, "y": 50, "size": 25,
        },
        {
            "name": "Edge Computing",
            "category": "Cloud & Infrastructure",
            "growth_rate": 120,
            "maturity": "Maturing",
            "description": "Processing data closer to the source for low-latency applications.",
            "x": 50, "y": 45, "size": 27,
        },
        {
            "name": "Quantum Computing",
            "category": "Emerging Tech",
            "growth_rate": 100,
            "maturity": "Experimental",
            "description": "Computing using quantum-mechanical phenomena for certain types of problems.",
            "x": 90, "y": 40, "size": 22,
        },
    ]
    return emerging
