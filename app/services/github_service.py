import httpx
import logging

logger = logging.getLogger(__name__)

# Mapping from common GitHub language names/keywords to our seeded skills
SKILL_KEYWORDS = {
    "python": "Python",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "html": "HTML",
    "css": "CSS",
    "sql": "SQL",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "aws": "AWS",
    "mlops": "MLOps",
    "llm": "LLMOps",
    "agentic": "Agentic AI",
    "git": "Git",
    "rust": "Rust",
    "go": "Go",
    "java": "Java",
    "c++": "C++",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "fastapi": "FastAPI",
    "react": "React",
    "node": "Node.js"
}

async def analyze_github_profile(username: str) -> list[str]:
    """
    Fetches the public repositories for the given GitHub username
    and returns a list of matched skill names based on repo languages
    and keywords.
    """
    url = f"https://api.github.com/users/{username}/repos?per_page=60"
    headers = {
        "User-Agent": "SkillSphere-AI-App"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code == 404:
                raise ValueError("GitHub user not found")
            elif response.status_code != 200:
                logger.error(f"GitHub API error: Status {response.status_code} - {response.text}")
                raise ValueError("Could not connect to GitHub API")
                
            repos = response.json()
            if not isinstance(repos, list):
                return []
                
            matched_skills = set()
            
            for repo in repos:
                # 1. Match by primary language
                lang = repo.get("language")
                if lang:
                    lang_lower = lang.lower()
                    if lang_lower in SKILL_KEYWORDS:
                        matched_skills.add(SKILL_KEYWORDS[lang_lower])
                
                # 2. Match by repo name/description keywords
                name = repo.get("name") or ""
                desc = repo.get("description") or ""
                combined_text = (name + " " + desc).lower()
                
                for key, skill_name in SKILL_KEYWORDS.items():
                    if key in combined_text:
                        matched_skills.add(skill_name)
                        
            return list(matched_skills)
            
    except httpx.RequestError as e:
        logger.error(f"HTTP error connecting to GitHub: {str(e)}")
        raise ValueError("Network error connecting to GitHub API")
