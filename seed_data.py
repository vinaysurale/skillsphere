"""
Seed script to populate the SkillSphere AI database with initial data.
Run: python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import create_tables, SessionLocal
from app.models.skill import Skill
from app.models.career_path import CareerPath, CareerPathSkill


def seed():
    create_tables()
    db = SessionLocal()

    # Check if already seeded
    if db.query(Skill).count() > 0:
        print("Database already seeded. Skipping...")
        db.close()
        return

    print("[*] Seeding SkillSphere AI database...")

    # ─── Skills ─────────────────────────────────────────────────────
    skills_data = [
        # Programming
        {"name": "Python", "category": "Programming", "demand_score": 92, "growth_score": 78, "avg_salary": 130000, "icon": "🐍", "description": "Versatile language for web, data science, AI, and automation."},
        {"name": "JavaScript", "category": "Programming", "demand_score": 90, "growth_score": 65, "avg_salary": 120000, "icon": "🟨", "description": "The language of the web — frontend, backend, and beyond."},
        {"name": "TypeScript", "category": "Programming", "demand_score": 85, "growth_score": 82, "avg_salary": 125000, "icon": "🔷", "description": "Type-safe JavaScript for large-scale applications."},
        {"name": "Go", "category": "Programming", "demand_score": 75, "growth_score": 80, "avg_salary": 140000, "icon": "🐹", "description": "Fast, concurrent language built by Google for cloud services."},
        {"name": "Rust", "category": "Programming", "demand_score": 65, "growth_score": 92, "avg_salary": 145000, "icon": "🦀", "description": "Memory-safe systems programming with zero-cost abstractions."},
        {"name": "Java", "category": "Programming", "demand_score": 82, "growth_score": 45, "avg_salary": 125000, "icon": "☕", "description": "Enterprise-grade language powering large-scale systems."},
        {"name": "C++", "category": "Programming", "demand_score": 70, "growth_score": 40, "avg_salary": 135000, "icon": "⚙️", "description": "High-performance language for systems, games, and embedded."},

        # AI/ML
        {"name": "TensorFlow", "category": "AI/ML", "demand_score": 80, "growth_score": 65, "avg_salary": 150000, "icon": "🧠", "description": "Google's deep learning framework for production ML."},
        {"name": "PyTorch", "category": "AI/ML", "demand_score": 82, "growth_score": 85, "avg_salary": 155000, "icon": "🔥", "description": "Facebook's flexible deep learning framework, preferred in research."},
        {"name": "MLOps", "category": "AI/ML", "demand_score": 78, "growth_score": 90, "avg_salary": 160000, "icon": "🔄", "description": "Practices for deploying and maintaining ML models in production."},
        {"name": "LLMOps", "category": "AI/ML", "demand_score": 72, "growth_score": 95, "avg_salary": 170000, "icon": "🤖", "description": "Operations for deploying and managing large language models."},
        {"name": "Agentic AI", "category": "AI/ML", "demand_score": 68, "growth_score": 98, "avg_salary": 180000, "icon": "🧬", "description": "Building autonomous AI agents that reason, plan, and act."},
        {"name": "NLP", "category": "AI/ML", "demand_score": 75, "growth_score": 72, "avg_salary": 148000, "icon": "💬", "description": "Natural Language Processing for text analysis and understanding."},
        {"name": "Computer Vision", "category": "AI/ML", "demand_score": 73, "growth_score": 70, "avg_salary": 150000, "icon": "👁️", "description": "Enabling machines to interpret and understand visual data."},
        {"name": "ML", "category": "AI/ML", "demand_score": 88, "growth_score": 75, "avg_salary": 152000, "icon": "📊", "description": "Core machine learning algorithms and model building."},

        # Cloud & Infrastructure
        {"name": "AWS", "category": "Cloud & Infrastructure", "demand_score": 90, "growth_score": 68, "avg_salary": 145000, "icon": "☁️", "description": "Amazon Web Services — the leading cloud platform."},
        {"name": "Azure", "category": "Cloud & Infrastructure", "demand_score": 82, "growth_score": 72, "avg_salary": 140000, "icon": "🔵", "description": "Microsoft's cloud platform for enterprise solutions."},
        {"name": "GCP", "category": "Cloud & Infrastructure", "demand_score": 72, "growth_score": 75, "avg_salary": 145000, "icon": "🌐", "description": "Google Cloud Platform for data and AI workloads."},
        {"name": "Kubernetes", "category": "Cloud & Infrastructure", "demand_score": 82, "growth_score": 78, "avg_salary": 155000, "icon": "⎈", "description": "Container orchestration for scalable deployments."},
        {"name": "Docker", "category": "Cloud & Infrastructure", "demand_score": 88, "growth_score": 60, "avg_salary": 130000, "icon": "🐳", "description": "Containerization platform for consistent environments."},

        # Data
        {"name": "SQL", "category": "Data", "demand_score": 90, "growth_score": 45, "avg_salary": 115000, "icon": "🗃️", "description": "Structured Query Language for relational databases."},
        {"name": "Pandas", "category": "Data", "demand_score": 78, "growth_score": 55, "avg_salary": 125000, "icon": "🐼", "description": "Python library for data manipulation and analysis."},
        {"name": "Spark", "category": "Data", "demand_score": 72, "growth_score": 60, "avg_salary": 145000, "icon": "⚡", "description": "Distributed computing engine for big data processing."},
        {"name": "dbt", "category": "Data", "demand_score": 68, "growth_score": 82, "avg_salary": 135000, "icon": "🔧", "description": "Data transformation tool for analytics engineering."},
        {"name": "Snowflake", "category": "Data", "demand_score": 70, "growth_score": 78, "avg_salary": 140000, "icon": "❄️", "description": "Cloud data warehouse for analytics at scale."},

        # DevOps
        {"name": "Git", "category": "DevOps", "demand_score": 95, "growth_score": 30, "avg_salary": 110000, "icon": "📦", "description": "Version control system — essential for all developers."},
        {"name": "CI/CD", "category": "DevOps", "demand_score": 85, "growth_score": 65, "avg_salary": 135000, "icon": "🚀", "description": "Continuous Integration/Deployment for automated pipelines."},
        {"name": "Terraform", "category": "DevOps", "demand_score": 78, "growth_score": 75, "avg_salary": 145000, "icon": "🏗️", "description": "Infrastructure as Code for cloud resource management."},
        {"name": "Ansible", "category": "DevOps", "demand_score": 65, "growth_score": 50, "avg_salary": 130000, "icon": "📋", "description": "Automation tool for configuration management and deployment."},

        # Security
        {"name": "Cybersecurity", "category": "Security", "demand_score": 85, "growth_score": 80, "avg_salary": 145000, "icon": "🛡️", "description": "Protecting systems, networks, and data from cyber threats."},
        {"name": "AI Security", "category": "Security", "demand_score": 65, "growth_score": 92, "avg_salary": 165000, "icon": "🔒", "description": "Securing AI systems against adversarial attacks."},
        {"name": "AI Governance", "category": "Security", "demand_score": 60, "growth_score": 88, "avg_salary": 155000, "icon": "⚖️", "description": "Frameworks for responsible and ethical AI development."},

        # Web Development
        {"name": "React", "category": "Web Development", "demand_score": 88, "growth_score": 60, "avg_salary": 125000, "icon": "⚛️", "description": "Popular JavaScript library for building user interfaces."},
        {"name": "Node.js", "category": "Web Development", "demand_score": 82, "growth_score": 55, "avg_salary": 120000, "icon": "🟢", "description": "JavaScript runtime for server-side development."},
        {"name": "FastAPI", "category": "Web Development", "demand_score": 70, "growth_score": 85, "avg_salary": 130000, "icon": "⚡", "description": "Modern Python web framework for building APIs."},
        {"name": "Next.js", "category": "Web Development", "demand_score": 78, "growth_score": 80, "avg_salary": 130000, "icon": "▲", "description": "React framework for production-grade web applications."},

        # Data Visualization
        {"name": "Tableau", "category": "Data Visualization", "demand_score": 72, "growth_score": 45, "avg_salary": 115000, "icon": "📈", "description": "Business intelligence tool for interactive visualizations."},
        {"name": "Power BI", "category": "Data Visualization", "demand_score": 70, "growth_score": 55, "avg_salary": 110000, "icon": "📊", "description": "Microsoft's analytics and visualization service."},
    ]

    skill_objects = {}
    for sd in skills_data:
        skill = Skill(**sd)
        db.add(skill)
        db.flush()
        skill_objects[sd["name"]] = skill

    print(f"  [+] Added {len(skills_data)} skills")

    # ─── Career Paths ───────────────────────────────────────────────
    career_paths_data = [
        {
            "name": "Machine Learning Engineer",
            "description": "Build and deploy ML models at scale, bridging data science and engineering.",
            "avg_salary": 165000,
            "demand_level": "Very High",
            "icon": "🤖",
            "skills": {
                "Required": ["Python", "ML", "Docker", "AWS", "Git", "SQL"],
                "Recommended": ["MLOps", "TensorFlow", "PyTorch", "Kubernetes"],
                "Optional": ["Spark", "CI/CD", "GCP"],
            },
        },
        {
            "name": "Data Scientist",
            "description": "Extract insights from data using statistical analysis and machine learning.",
            "avg_salary": 150000,
            "demand_level": "High",
            "icon": "📊",
            "skills": {
                "Required": ["Python", "SQL", "ML", "Pandas", "Git"],
                "Recommended": ["TensorFlow", "PyTorch", "NLP", "Tableau"],
                "Optional": ["Spark", "dbt", "Power BI"],
            },
        },
        {
            "name": "Cloud Architect",
            "description": "Design and oversee cloud computing strategy and infrastructure.",
            "avg_salary": 170000,
            "demand_level": "Very High",
            "icon": "☁️",
            "skills": {
                "Required": ["AWS", "Docker", "Kubernetes", "Terraform", "Git"],
                "Recommended": ["Azure", "GCP", "CI/CD", "Ansible"],
                "Optional": ["Python", "Cybersecurity"],
            },
        },
        {
            "name": "Full Stack Developer",
            "description": "Build complete web applications, from frontend to backend.",
            "avg_salary": 135000,
            "demand_level": "High",
            "icon": "🖥️",
            "skills": {
                "Required": ["JavaScript", "React", "Node.js", "SQL", "Git"],
                "Recommended": ["TypeScript", "Docker", "Next.js", "CI/CD"],
                "Optional": ["AWS", "Python"],
            },
        },
        {
            "name": "DevOps Engineer",
            "description": "Automate and streamline development and deployment workflows.",
            "avg_salary": 155000,
            "demand_level": "Very High",
            "icon": "🔧",
            "skills": {
                "Required": ["Docker", "Kubernetes", "CI/CD", "Git", "AWS"],
                "Recommended": ["Terraform", "Python", "Ansible"],
                "Optional": ["Azure", "GCP", "Cybersecurity"],
            },
        },
        {
            "name": "AI Engineer",
            "description": "Build and deploy AI-powered products and systems using cutting-edge models.",
            "avg_salary": 175000,
            "demand_level": "Very High",
            "icon": "🧬",
            "skills": {
                "Required": ["Python", "ML", "LLMOps", "Docker", "Git"],
                "Recommended": ["Agentic AI", "PyTorch", "AWS", "MLOps"],
                "Optional": ["NLP", "Computer Vision", "Kubernetes"],
            },
        },
        {
            "name": "Data Engineer",
            "description": "Build data pipelines and infrastructure for data-driven organizations.",
            "avg_salary": 150000,
            "demand_level": "High",
            "icon": "🔩",
            "skills": {
                "Required": ["Python", "SQL", "Spark", "AWS", "Git"],
                "Recommended": ["Docker", "dbt", "Snowflake", "CI/CD"],
                "Optional": ["Terraform", "Pandas", "Kafka"],
            },
        },
        {
            "name": "Cybersecurity Analyst",
            "description": "Protect organizations from cyber threats and ensure data security.",
            "avg_salary": 140000,
            "demand_level": "High",
            "icon": "🛡️",
            "skills": {
                "Required": ["Cybersecurity", "Python", "Git"],
                "Recommended": ["AWS", "Docker", "AI Security"],
                "Optional": ["AI Governance", "Terraform"],
            },
        },
    ]

    for cpd in career_paths_data:
        cp = CareerPath(
            name=cpd["name"],
            description=cpd["description"],
            avg_salary=cpd["avg_salary"],
            demand_level=cpd["demand_level"],
            icon=cpd["icon"],
        )
        db.add(cp)
        db.flush()

        for importance, skill_names in cpd["skills"].items():
            for sname in skill_names:
                if sname in skill_objects:
                    cps = CareerPathSkill(
                        career_path_id=cp.id,
                        skill_id=skill_objects[sname].id,
                        importance=importance,
                    )
                    db.add(cps)

    print(f"  [+] Added {len(career_paths_data)} career paths")

    db.commit()
    db.close()
    print("[OK] Database seeded successfully!")


if __name__ == "__main__":
    seed()
